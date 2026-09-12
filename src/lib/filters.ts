import type { Lesson, LessonKind } from '@/lib/lesson';
import {
	addDays,
	addMonths,
	addWeeks,
	endOfMonth,
	endOfWeek,
	formatMonth,
	formatRange,
	startOfMonth,
	startOfWeek,
	today,
} from '@/lib/date';

/*
 * Фильтрация живёт отдельным чистым модулем, а не внутри TanStack Table.
 *
 * Причина простая: почти все фильтры здесь сквозные — поиск идёт сразу по предмету,
 * преподавателю и аудитории, «только мои» смотрит на список предметов в настройках,
 * период — на дату. Колоночные фильтры таблицы каждое такое условие превратили бы в
 * отдельный filterFn с доступом к чужим колонкам. Таблице остаётся то, что она делает
 * хорошо: сортировка, видимость и порядок колонок.
 *
 * Бонус: те же функции применяются к списку изменений, где таблицы нет вовсе.
 */

export type Period = 'week' | 'next' | 'month' | 'all';

export interface FilterState
{
	search: string;
	teachers: string[];
	kinds: LessonKind[];
	period: Period;
	/**
	 * Дата, от которой считается период. Не «выбранный день», а точка отсчёта: стрелки
	 * «‹ ›» двигают именно её, и по ней же вычисляются границы недели или месяца.
	 *
	 * Отдельно от period, потому что переключение «Неделя → Месяц» не должно возвращать
	 * человека в текущий месяц: он смотрел октябрь — пусть увидит октябрь целиком.
	 */
	anchor: string;
	/** Показывать только предметы, отмеченные в «Мои пары». */
	onlyMine: boolean;
}

export function emptyFilters (anchor: string = today()): FilterState
{
	return { search: '', teachers: [], kinds: [], period: 'week', anchor, onlyMine: false };
}

/*
 * Точка отсчёта в «нетронутость» фильтров НЕ входит.
 *
 * У даты свой орган управления — стрелки и кнопка «Сегодня», — и складывать их с
 * «Сбросить фильтры» значит предлагать человеку сбросить то, что он и не настраивал:
 * перелистнул неделю — и уже появилась кнопка сброса, будто он что-то отфильтровал.
 */
export function isDefaultFilters (state: FilterState): boolean
{
	return state.search === ''
		&& state.teachers.length === 0
		&& state.kinds.length === 0
		&& state.period === 'week'
		&& !state.onlyMine;
}

export interface PeriodRange
{
	from: string;
	to: string;
}

export function periodRange (period: Period, anchor: string): PeriodRange | null
{
	switch (period)
	{
		case 'week':
			return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
		case 'next':
			return { from: startOfWeek(anchor), to: endOfWeek(addDays(anchor, 7)) };
		case 'month':
			return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
		case 'all':
			return null;
	}
}

/** Шаг стрелок «‹ ›» — ровно та единица, которой меряется текущий период. */
export function shiftAnchor (period: Period, anchor: string, direction: -1 | 1): string
{
	switch (period)
	{
		case 'week':
			return addWeeks(anchor, direction);
		case 'next':
			return addWeeks(anchor, direction * 2);
		case 'month':
			return addMonths(anchor, direction);
		case 'all':
			return anchor;
	}
}

/** Подпись между стрелками: «7–13 сент.», «Сентябрь». */
export function rangeLabel (period: Period, anchor: string): string
{
	if (period === 'month') return formatMonth(anchor);

	const range = periodRange(period, anchor);
	return range ? formatRange(range.from, range.to) : '';
}

/** Попадает ли сегодняшний день в показанный период — по этому прячется «Сегодня». */
export function coversToday (period: Period, anchor: string): boolean
{
	const range = periodRange(period, anchor);
	if (!range) return true;

	const now = today();
	return range.from <= now && now <= range.to;
}

export const PERIOD_LABELS: Record<Period, string> = {
	week: 'Неделя',
	next: 'Две недели',
	month: 'Месяц',
	all: 'Всё',
};

/**
 * Отбор пар.
 *
 * `mySubjects` приходит отдельным аргументом, а не частью FilterState: это настройка
 * человека (живёт в localStorage и переживает перезагрузку), а фильтры — состояние
 * страницы, которое уезжает в адресную строку и передаётся другим людям. Смешай их —
 * и ссылка «смотри, что у нас во вторник» принесла бы адресату чужой список предметов.
 */
export function applyFilters (lessons: Lesson[], state: FilterState, mySubjects: string[]): Lesson[]
{
	const needle = state.search.trim().toLowerCase();
	const range = periodRange(state.period, state.anchor);
	const mine = new Set(mySubjects);

	return lessons.filter((lesson) =>
	{
		if (range && (lesson.date < range.from || lesson.date > range.to)) return false;
		if (state.kinds.length > 0 && !state.kinds.includes(lesson.kind)) return false;

		/*
		 * Преподаватели — ИЛИ, а не И: выбрав двоих, человек хочет увидеть пары обоих.
		 * Пара с двумя преподавателями подходит, если совпал хотя бы один.
		 */
		if (state.teachers.length > 0 && !lesson.teachers.some((name) => state.teachers.includes(name))) return false;

		/*
		 * «Только мои» с пустым списком предметов ничего не прячет. Иначе включённый
		 * тумблер при неоткрытых настройках давал бы пустую таблицу без объяснений.
		 */
		if (state.onlyMine && mine.size > 0 && !mine.has(lesson.subject)) return false;

		if (needle && !matches(lesson, needle)) return false;

		return true;
	});
}

function matches (lesson: Lesson, needle: string): boolean
{
	return lesson.subject.toLowerCase().includes(needle)
		|| lesson.kindLabel.toLowerCase().includes(needle)
		|| lesson.teachers.some((name) => name.toLowerCase().includes(needle))
		|| lesson.rooms.some((room) => room.toLowerCase().includes(needle));
}
