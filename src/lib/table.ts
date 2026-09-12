import {
	columnVisibilityFeature,
	createSortedRowModel,
	rowSortingFeature,
	tableFeatures,
	type ColumnDef,
	type Row,
} from '@tanstack/vue-table';

import type { Lesson } from '@/lib/lesson';
import type { ColumnId } from '@/stores/preferences';

/*
 * Набор возможностей таблицы. В девятой версии они подключаются поимённо — здесь нужны
 * ровно две: видимость колонок и сортировка.
 *
 * Фильтрация НЕ подключена намеренно, хотя такая фича есть. Почти все фильтры страницы
 * сквозные (поиск идёт разом по предмету, преподавателю и аудитории; «только мои» смотрит
 * в настройки, а не в строку), и колоночная модель превратила бы каждый из них в filterFn,
 * которому нужен доступ к чужим колонкам. Отбор делает lib/filters.ts над обычным
 * массивом — те же функции переиспользует страница изменений, где таблицы нет вовсе.
 *
 * Порядок колонок тоже не подключён: их семь, все нужны, и перетасовка мест решала бы
 * задачу, которой никто не ставил.
 */
export const scheduleFeatures = tableFeatures({
	columnVisibilityFeature,
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
});

type Features = typeof scheduleFeatures;

export type ScheduleColumnDef = ColumnDef<Features, Lesson, unknown>;

/*
 * Сравнение строк по-русски. Встроенный alphanumeric сортирует по кодам символов, и «Ё»
 * уезжает в конец алфавита, за «Я» — в списке преподавателей это сразу заметно.
 *
 * Функция передаётся колонке напрямую (не через реестр sortFns): регистрация нужна лишь
 * тем, кого выбирают по имени из строки.
 */
function byRussian (rowA: Row<Features, Lesson>, rowB: Row<Features, Lesson>, columnId: string): number
{
	return String(rowA.getValue(columnId) ?? '').localeCompare(String(rowB.getValue(columnId) ?? ''), 'ru');
}

/* Пары вне сетки (мероприятия на день) при сортировке по номеру уходят вниз, а не
   притворяются нулевой парой. */
const NO_SLOT = 99;

export const scheduleColumns: ScheduleColumnDef[] = [
	{ id: 'date', header: 'Дата', accessorFn: (lesson) => lesson.date },
	{ id: 'slot', header: '№', accessorFn: (lesson) => lesson.slot ?? NO_SLOT },
	{ id: 'time', header: 'Время', accessorFn: (lesson) => lesson.beginMinutes },
	{ id: 'subject', header: 'Предмет', accessorFn: (lesson) => lesson.subject, sortFn: byRussian },
	{ id: 'kind', header: 'Тип', accessorFn: (lesson) => lesson.kindLabel, sortFn: byRussian },
	{ id: 'teachers', header: 'Преподаватель', accessorFn: (lesson) => lesson.teachers.join(', '), sortFn: byRussian },
	{ id: 'rooms', header: 'Аудитория', accessorFn: (lesson) => lesson.rooms.join(', '), sortFn: byRussian },
];

/** Колонки с числами и временем прижимаем вправо — иначе цифры не сравнить глазом. */
export const ALIGN_END: ColumnId[] = [ 'slot' ];
