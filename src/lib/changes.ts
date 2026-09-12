import type { ChangeEntry, ChangeSide } from '@/api/DTOs';
import type { Lesson } from '@/lib/lesson';

/*
 * Связка журнала правок с таблицей.
 *
 * Журнал приходит отдельным файлом и ничего не знает про идентификаторы пар — их считает
 * фронт. Поэтому обе стороны приводятся к одному ключу «дата + начало + предмет»: по нему
 * строка в расписании узнаёт, что именно её на прошлом прогоне и переставили.
 *
 * Аудитория и преподаватель в ключ не входят намеренно: чаще всего меняются как раз они,
 * и включи мы их — подсветка не нашла бы ни одной строки ровно в тех случаях, ради
 * которых она и нужна.
 */

export function keyOfSide (side: ChangeSide): string
{
	return `${side.date}|${side.begin}|${side.subject}`;
}

export function keyOfLesson (lesson: Lesson): string
{
	return `${lesson.date}|${lesson.begin}|${lesson.subject}`;
}

/**
 * Ключи пар, задетых самым свежим прогоном.
 *
 * Именно свежим, а не всеми: за семестр журнал накопит сотни записей, и подсвеченной
 * оказалась бы половина таблицы — подсветка, которая горит всегда, не сообщает ничего.
 */
export function keysChangedInLatestRun (entries: ChangeEntry[]): Set<string>
{
	if (!entries.length) return new Set();

	const latest = entries.reduce((max, entry) => (entry.detectedAt > max ? entry.detectedAt : max), entries[0]!.detectedAt);

	const keys = new Set<string>();
	for (const entry of entries)
	{
		if (entry.detectedAt !== latest) continue;
		// Удалённую пару в таблице не подсветить — её там уже нет; берём обе стороны,
		// чтобы у переноса отметилось и новое место.
		if (entry.after) keys.add(keyOfSide(entry.after));
		if (entry.before) keys.add(keyOfSide(entry.before));
	}

	return keys;
}
