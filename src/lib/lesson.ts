import type { RawLesson } from '@/api/DTOs';
import { minutesBetween, shortTime, toMinutes, weekdayOf } from '@/lib/date';

/*
 * Нормализованная пара — то, чем оперирует вся остальная страница.
 *
 * Ответ API устроен неудобно для показа: преподаватель и аудитория лежат вместе в одном
 * массиве instructors (аудитория — свойство преподавателя, а не занятия), время с
 * секундами, тип занятия — длинной человеческой строкой. Разбирать это в каждом
 * компоненте значило бы повторять одни и те же три строки в таблице, карточках,
 * фильтрах и поиске — и однажды разойтись в одной из них.
 */

export type LessonKind = 'lecture' | 'practice' | 'lab' | 'exam' | 'other';

export interface Lesson
{
	/** Стабильный ключ строки: дата + начало + предмет. Переживает пересортировку. */
	id: string;
	date: string;
	weekday: number;
	begin: string;
	end: string;
	beginMinutes: number;
	/** Номер пары по времени начала; null — если время не из сетки (события вне сетки). */
	slot: number | null;
	subject: string;
	kind: LessonKind;
	/** Оригинальный eventType — его и показываем, сокращая только в узких местах. */
	kindLabel: string;
	teachers: string[];
	rooms: string[];
	/** Событие на весь день (военка, практика): номер пары для него бессмысленен. */
	isAllDay: boolean;
	/**
	 * В это же время у группы стоит ещё одна пара. Признака подгруппы в ответе API нет
	 * вовсе, и восстановить его неоткуда — но именно так подгруппы и выглядят в данных,
	 * поэтому пару стоит пометить и дать человеку решить самому.
	 */
	hasConflict: boolean;
}

/*
 * Сетка звонков ЮУрГУ. Нужна не ради красоты: «3-я пара» — то, чем расписание меряют в
 * разговоре, и в уведомлении о переносе оно читается куда лучше, чем «11:30».
 *
 * Время, которого в сетке нет, даёт slot: null, а не ближайший номер: соврать про номер
 * пары хуже, чем не назвать его.
 */
const SLOTS: Record<string, number> = {
	'08:00': 1,
	'09:45': 2,
	'11:30': 3,
	'13:35': 4,
	'15:20': 5,
	'17:05': 6,
	'18:50': 7,
	'20:30': 8,
};

/** Дольше четырёх часов — это не пара, а мероприятие на день. */
const ALL_DAY_MINUTES = 4 * 60;

const KIND_BY_PREFIX: Array<[ string, LessonKind ]> = [
	[ 'лекц', 'lecture' ],
	[ 'практи', 'practice' ],
	[ 'семинар', 'practice' ],
	[ 'лаборатор', 'lab' ],
	[ 'экзамен', 'exam' ],
	[ 'зачёт', 'exam' ],
	[ 'зачет', 'exam' ],
	[ 'консультаци', 'exam' ],
];

export function kindOf (eventType: string): LessonKind
{
	const lower = eventType.toLowerCase();
	for (const [ prefix, kind ] of KIND_BY_PREFIX)
	{
		if (lower.includes(prefix)) return kind;
	}
	return 'other';
}

export const KIND_LABELS: Record<LessonKind, string> = {
	lecture: 'Лекция',
	practice: 'Практика',
	lab: 'Лаба',
	exam: 'Экзамен',
	other: 'Прочее',
};

export function normalize (raw: RawLesson[]): Lesson[]
{
	/*
	 * Совпадения по времени считаем ДО сборки списка: признак «в это же время есть ещё
	 * пара» — свойство не пары, а всего дня, и вычислить его построчно нельзя.
	 */
	const perSlot = new Map<string, number>();
	for (const item of raw)
	{
		const key = `${item.eventDate}|${item.beginTime}`;
		perSlot.set(key, (perSlot.get(key) ?? 0) + 1);
	}

	const lessons = raw.map((item) =>
	{
		const begin = shortTime(item.beginTime);
		const duration = minutesBetween(item.beginTime, item.endTime);
		const isAllDay = duration >= ALL_DAY_MINUTES;

		/*
		 * Преподаватель «-» встречается в мероприятиях без ведущего (военка). Пустая
		 * ячейка честнее прочерка: по прочерку люди начинают искать преподавателя с
		 * таким именем в фильтре, и он там даже находится.
		 */
		const teachers = unique(item.instructors.map((person) => person.name.trim()).filter(isMeaningful));
		const rooms = unique(item.instructors.map((person) => (person.location ?? '').trim()).filter(isMeaningful));

		return {
			id: `${item.eventDate}|${begin}|${item.subject}`,
			date: item.eventDate,
			weekday: weekdayOf(item.eventDate),
			begin,
			end: shortTime(item.endTime),
			beginMinutes: toMinutes(item.beginTime),
			slot: isAllDay ? null : SLOTS[begin] ?? null,
			subject: item.subject.trim(),
			kind: kindOf(item.eventType),
			kindLabel: item.eventType.trim(),
			teachers,
			rooms,
			isAllDay,
			hasConflict: (perSlot.get(`${item.eventDate}|${item.beginTime}`) ?? 0) > 1,
		} satisfies Lesson;
	});

	/*
	 * Сортировка по дате и времени делается здесь, а не в таблице: карточки на мобиле и
	 * экспорт ссылки тоже ждут хронологию, а не порядок, в котором API решил отдать строки
	 * (в дампе он местами не хронологический — см. 2026-09-04 в примере).
	 */
	lessons.sort((a, b) => a.date.localeCompare(b.date) || a.beginMinutes - b.beginMinutes);

	/*
	 * Развод одинаковых id. Дата, время и предмет совпадают ровно в том случае, ради
	 * которого всё и затевалось: две подгруппы слушают один предмет в одно время в разных
	 * аудиториях. Таблица различает строки по id, и повторяющийся ключ заставил бы Vue
	 * переиспользовать одну строку для обеих пар — вторая просто не появилась бы на экране.
	 */
	const seen = new Map<string, number>();
	for (const lesson of lessons)
	{
		const count = seen.get(lesson.id) ?? 0;
		seen.set(lesson.id, count + 1);
		if (count > 0) lesson.id = `${lesson.id}#${count}`;
	}

	return lessons;
}

/** Все преподаватели группы — для мультиселекта. Отсортированы по фамилии. */
export function teachersOf (lessons: Lesson[]): string[]
{
	return unique(lessons.flatMap((lesson) => lesson.teachers)).sort((a, b) => a.localeCompare(b, 'ru'));
}

/** Все предметы — для модалки «Мои пары». */
export function subjectsOf (lessons: Lesson[]): string[]
{
	return unique(lessons.map((lesson) => lesson.subject)).sort((a, b) => a.localeCompare(b, 'ru'));
}

export function slotLabel (lesson: Lesson): string
{
	if (lesson.isAllDay) return 'весь день';
	return lesson.slot ? `${lesson.slot}-я пара` : '—';
}

function unique (values: string[]): string[]
{
	return [ ...new Set(values) ];
}

function isMeaningful (value: string): boolean
{
	return value.length > 0 && value !== '-' && value !== '—';
}
