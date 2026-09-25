"""Выгрузка расписания из online.susu.ru и ведение журнала изменений.

Скрипт делает ровно три вещи:

1. просит у гейтвея расписание каждой группы из public/data/groups.json;
2. сравнивает ответ с дампом, который уже лежит в репозитории, и дописывает
   расхождения в public/data/changes/<guid>.json;
3. обновляет public/data/meta.json — отметки времени, по которым страница понимает,
   что файлы изменились, и обходит кэш GitHub Pages.

Парсить нечего: API отдаёт готовый JSON. Вся сложность — в сравнении, и она
сосредоточена в diff_lessons().

Запуск:

    SUSU_TOKEN='eyJ...' python scripts/fetch_schedule.py
    python scripts/fetch_schedule.py --dry-run   # ничего не писать, только показать

Токен живёт около суток. Вместо него можно задать SUSU_LOGIN, SUSU_PASSWORD и
SUSU_AUTH_URL — тогда свежий токен берётся на каждом прогоне.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"

GROUPS_FILE = DATA / "groups.json"
META_FILE = DATA / "meta.json"
SCHEDULE_DIR = DATA / "schedule"
CHANGES_DIR = DATA / "changes"

API = "https://online.susu.ru/microgateway/api/Schedule/GetGroupSchedule"

TIMEOUT = 30


# --------------------------------------------------------------------------- модель


@dataclass(frozen=True)
class Slot:
	"""Пара в том виде, в котором её сравнивают.

	Кортеж, а не словарь, и заморожен: он же служит ключом в множествах, а сравнение
	словарей по содержимому пришлось бы писать руками и однажды забыть про новое поле.
	"""

	date: str
	begin: str
	end: str
	subject: str
	type: str
	teachers: tuple[str, ...]
	rooms: tuple[str, ...]

	def as_side(self) -> dict[str, Any]:
		"""Снимок для журнала изменений — ровно в той форме, которую ждёт страница."""
		return {
			"date": self.date,
			"begin": self.begin,
			"end": self.end,
			"subject": self.subject,
			"type": self.type,
			"teachers": list(self.teachers),
			"rooms": list(self.rooms),
		}

	@property
	def at(self) -> tuple[str, str, str]:
		"""Ключ «то же занятие на том же месте»: дата, начало, предмет."""
		return (self.date, self.begin, self.subject)

	@property
	def what(self) -> tuple[str, str]:
		"""Ключ «то же занятие, но неизвестно когда»: дата и предмет."""
		return (self.date, self.subject)


def to_slot(raw: dict[str, Any]) -> Slot:
	instructors = raw.get("instructors") or []

	# «-» в поле преподавателя означает «его нет» (военка, мероприятия). Оставлять
	# прочерк нельзя: в diff он выглядел бы как настоящее имя и участвовал в сравнении.
	teachers = tuple(sorted({
		str(person.get("name", "")).strip()
		for person in instructors
		if str(person.get("name", "")).strip() not in ("", "-", "—")
	}))
	rooms = tuple(sorted({
		str(person.get("location", "") or "").strip()
		for person in instructors
		if str(person.get("location", "") or "").strip() not in ("", "-", "—")
	}))

	return Slot(
		date=str(raw.get("eventDate", ""))[:10],
		begin=str(raw.get("beginTime", ""))[:5],
		end=str(raw.get("endTime", ""))[:5],
		subject=str(raw.get("subject", "")).strip(),
		type=str(raw.get("eventType", "")).strip(),
		teachers=teachers,
		rooms=rooms,
	)


# ------------------------------------------------------------------------ сравнение


def diff_lessons(old: list[dict[str, Any]], new: list[dict[str, Any]], detected_at: str) -> list[dict[str, Any]]:
	"""Что изменилось между прошлым дампом и текущим ответом API.

	Порядок разбора — от точного совпадения к приблизительному, и он важен: иначе
	перенесённая пара попала бы в журнал как «удалено» плюс «добавлено», то есть двумя
	записями вместо одной, и прочитать их как один перенос было бы уже нельзя.

	    1. полностью совпавшие пары выкидываются (их большинство);
	    2. среди оставшихся ищутся совпадения по дате+времени+предмету — это «изменено»
	       (поменялась аудитория, тип или преподаватель);
	    3. затем по дате+предмету — это «перенесено» (сдвинули время);
	    4. что осталось — честные «добавлено» и «удалено».
	"""
	old_slots = [to_slot(item) for item in old]
	new_slots = [to_slot(item) for item in new]

	# Границы сравнения — пересечение диапазонов дат.
	#
	# Если API однажды отдаст скользящее окно (только ближайший месяц), всё, что осталось
	# за его краем, выглядело бы как массово удалённые пары. Такой «диff» на сотню записей
	# не просто бесполезен — он вытеснит из журнала настоящие правки.
	window = intersect_range(old_slots, new_slots)
	if window is None:
		return []

	start, end = window
	old_in = [slot for slot in old_slots if start <= slot.date <= end]
	new_in = [slot for slot in new_slots if start <= slot.date <= end]

	removed = Counter(old_in) - Counter(new_in)
	added = Counter(new_in) - Counter(old_in)

	entries: list[dict[str, Any]] = []

	entries += match_pairs(removed, added, key=lambda slot: slot.at, kind="edited", detected_at=detected_at)
	entries += match_pairs(removed, added, key=lambda slot: slot.what, kind="moved", detected_at=detected_at)

	for slot in sorted(removed.elements(), key=lambda item: (item.date, item.begin)):
		entries.append(entry(detected_at, "removed", slot.date, before=slot, after=None))

	for slot in sorted(added.elements(), key=lambda item: (item.date, item.begin)):
		entries.append(entry(detected_at, "added", slot.date, before=None, after=slot))

	return entries


def match_pairs(removed: Counter, added: Counter, key, kind: str, detected_at: str) -> list[dict[str, Any]]:
	"""Свести исчезнувшее с появившимся по общему ключу и списать обе стороны."""
	buckets: dict[Any, list[Slot]] = {}
	for slot in added.elements():
		buckets.setdefault(key(slot), []).append(slot)

	entries: list[dict[str, Any]] = []

	for slot in sorted(removed.elements(), key=lambda item: (item.date, item.begin)):
		bucket = buckets.get(key(slot))
		if not bucket:
			continue

		partner = bucket.pop()
		removed[slot] -= 1
		added[partner] -= 1
		entries.append(entry(detected_at, kind, slot.date, before=slot, after=partner))

	# Counter с нулями и отрицательными значениями дальше мешает: elements() их
	# пропускает, но вычитание в следующем проходе считало бы уже не то.
	for counter in (removed, added):
		for item in [key for key, count in counter.items() if count <= 0]:
			del counter[item]

	return entries


def intersect_range(old: list[Slot], new: list[Slot]) -> tuple[str, str] | None:
	"""Диапазон дат, покрытый обоими дампами."""
	if not old or not new:
		return None

	start = max(min(slot.date for slot in old), min(slot.date for slot in new))
	end = min(max(slot.date for slot in old), max(slot.date for slot in new))

	return (start, end) if start <= end else None


def entry(detected_at: str, kind: str, date: str, before: Slot | None, after: Slot | None) -> dict[str, Any]:
	return {
		"detectedAt": detected_at,
		"kind": kind,
		"date": date,
		"before": before.as_side() if before else None,
		"after": after.as_side() if after else None,
	}


# ------------------------------------------------------------------------------ ввод-вывод


def read_json(path: Path, fallback: Any) -> Any:
	if not path.exists():
		return fallback
	return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
	path.parent.mkdir(parents=True, exist_ok=True)
	# ensure_ascii=False — файлы читают глазами в diff коммита, и ФИО
	# там не читается вовсе. Перевод строки в конце нужен git.
	path.write_text(json.dumps(value, ensure_ascii=False, indent="\t") + "\n", encoding="utf-8")


def fetch_token() -> str:
	"""Токен доступа к гейтвею.

	SUSU_TOKEN берётся как есть (JWT живёт около суток). Без него логин с паролем
	меняются на свежий токен через SUSU_AUTH_URL.
	"""
	token = os.environ.get("SUSU_TOKEN", "").strip()
	if token:
		return token

	login = os.environ.get("SUSU_LOGIN", "").strip()
	password = os.environ.get("SUSU_PASSWORD", "").strip()
	auth_url = os.environ.get("SUSU_AUTH_URL", "").strip()

	if not (login and password and auth_url):
		sys.exit(
			"Нет доступа к API: задайте SUSU_TOKEN либо "
			"SUSU_LOGIN + SUSU_PASSWORD + SUSU_AUTH_URL."
		)

	response = requests.post(auth_url, json={"login": login, "password": password}, timeout=TIMEOUT)
	response.raise_for_status()
	payload = response.json()

	# Имя поля у разных эндпоинтов разное, а гадать вслепую дороже, чем перебрать три.
	for field in ("token", "accessToken", "access_token"):
		if isinstance(payload, dict) and payload.get(field):
			return str(payload[field])

	sys.exit(f"Ответ {auth_url} не содержит токена: {list(payload)[:10]}")


def fetch_group(group_id: str, token: str) -> list[dict[str, Any]]:
	response = requests.get(
		f"{API}/{group_id}",
		headers={
			"Authorization": f"Bearer {token}",
			"Accept": "application/json",
			"Referer": "https://online.susu.ru/schedule",
		},
		timeout=TIMEOUT,
	)
	response.raise_for_status()

	data = response.json()
	if not isinstance(data, list):
		raise SystemExit(f"Ожидался массив занятий, пришло {type(data).__name__}")

	return data


# ---------------------------------------------------------------------------- прогон


def run(dry_run: bool) -> int:
	groups: Iterable[dict[str, Any]] = read_json(GROUPS_FILE, {"groups": []})["groups"]
	if not groups:
		sys.exit(f"В {GROUPS_FILE.relative_to(ROOT)} нет ни одной группы")

	token = fetch_token()
	detected_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

	meta = read_json(META_FILE, {"updatedAt": None, "groups": {}})
	meta.setdefault("groups", {})

	touched = 0

	for group in groups:
		group_id = group["id"]
		name = group.get("name", group_id)

		schedule_path = SCHEDULE_DIR / f"{group_id}.json"
		changes_path = CHANGES_DIR / f"{group_id}.json"

		previous = read_json(schedule_path, [])
		current = fetch_group(group_id, token)

		if previous == current:
			print(f"= {name}: без изменений ({len(current)} занятий)")
			continue

		new_entries = diff_lessons(previous, current, detected_at)

		print(f"+ {name}: {len(current)} занятий, {len(new_entries)} изменений")
		for item in new_entries[:20]:
			print(f"    {item['kind']:8} {item['date']} {describe(item)}")

		if dry_run:
			continue

		write_json(schedule_path, current)

		# Журнал только дописывается: он и есть история, восстановить её из дампов
		# задним числом нельзя — прошлых дампов в репозитории не остаётся.
		log = read_json(changes_path, {"updatedAt": None, "entries": []})
		log["entries"] = log.get("entries", []) + new_entries
		log["updatedAt"] = detected_at
		write_json(changes_path, log)

		meta["groups"][group_id] = {
			"updatedAt": detected_at,
			"lessons": len(current),
			"changes": len(log["entries"]),
		}
		touched += 1

	if touched and not dry_run:
		meta["updatedAt"] = detected_at
		write_json(META_FILE, meta)

	print(f"\nОбновлено групп: {touched}")

	# Код возврата всегда нулевой, а есть ли что коммитить, показывает git status:
	# отдельный код для «изменений нет» был бы неотличим от единицы, которой
	# завершается упавший запрос.
	return 0


def describe(item: dict[str, Any]) -> str:
	side = item.get("after") or item.get("before") or {}
	return f"{side.get('begin', '')} {side.get('subject', '')}"


def main() -> None:
	parser = argparse.ArgumentParser(description="Выгрузка расписания ЮУрГУ")
	parser.add_argument("--dry-run", action="store_true", help="ничего не записывать")
	args = parser.parse_args()

	sys.exit(run(args.dry_run))


if __name__ == "__main__":
	main()
