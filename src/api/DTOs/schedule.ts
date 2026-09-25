import { z } from 'zod';

/*
 * Формы данных описаны схемами, а не только типами, и это не перестраховка.
 *
 * Источник — дампы из online.susu.ru, которые кладёт в репозиторий скрипт выгрузки.
 * Поменяй университет форму ответа (переименуй поле, начни присылать null) — при
 * голых TypeScript-типах страница молча нарисовала бы пустые ячейки, и понять,
 * что данные уже другие, было бы неоткуда: бэкенда, который отдал бы 500, здесь нет.
 * Схема падает в тот же момент и с именем поля, а ErrorState показывает это человеку.
 */

export const instructorSchema = z.object({
	name: z.string(),
	roomId: z.string().nullable().
		optional(),
	location: z.string().nullable().
		optional(),
});

/** Один элемент ответа GetGroupSchedule — ровно как его отдаёт API, без переименований. */
export const rawLessonSchema = z.object({
	beginTime: z.string(),
	endTime: z.string(),
	subject: z.string(),
	eventType: z.string(),
	eventDate: z.string(),
	instructors: z.array(instructorSchema).default([]),
	isAllowedToOpen: z.boolean().optional(),
});

export const rawScheduleSchema = z.array(rawLessonSchema);

export const groupSchema = z.object({
	/** GUID группы в СУСУ: им же назван файл дампа и по нему ходит скрипт выгрузки. */
	id: z.string(),
	/** Короткий идентификатор для адресной строки (?group=…) — ссылку можно кинуть однокурснику. */
	slug: z.string(),
	name: z.string(),
	/** Своя группа: открывается по умолчанию, когда в localStorage ещё пусто. */
	mine: z.boolean().optional(),
});

export const groupsFileSchema = z.object({
	groups: z.array(groupSchema),
});

/*
 * Отметки времени по каждой группе отдельно, а не одна на весь репозиторий:
 * прогон мог обновить одну группу и упасть на второй, и «обновлено 5 минут назад»
 * над устаревшей таблицей — это ровно то враньё, ради борьбы с которым всё затевалось.
 */
export const metaGroupSchema = z.object({
	updatedAt: z.string().nullable(),
	lessons: z.number().default(0),
	changes: z.number().default(0),
});

export const metaFileSchema = z.object({
	updatedAt: z.string().nullable(),
	groups: z.record(z.string(), metaGroupSchema),
});

/** Снимок пары — как она выглядела до/после правки. */
export const changeSideSchema = z.object({
	date: z.string(),
	begin: z.string(),
	end: z.string(),
	subject: z.string(),
	type: z.string(),
	teachers: z.array(z.string()).default([]),
	rooms: z.array(z.string()).default([]),
});

export const changeEntrySchema = z.object({
	/** Когда правку заметил прогон — не когда её внёс деканат: этого API не сообщает. */
	detectedAt: z.string(),
	kind: z.enum([ 'added', 'removed', 'moved', 'edited' ]),
	/** Дата занятия, которого касается правка. Для переносов — дата «до». */
	date: z.string(),
	before: changeSideSchema.nullable(),
	after: changeSideSchema.nullable(),
});

export const changesFileSchema = z.object({
	updatedAt: z.string().nullable(),
	entries: z.array(changeEntrySchema),
});

export type Instructor = z.infer<typeof instructorSchema>;
export type RawLesson = z.infer<typeof rawLessonSchema>;
export type Group = z.infer<typeof groupSchema>;
export type MetaGroup = z.infer<typeof metaGroupSchema>;
export type MetaFile = z.infer<typeof metaFileSchema>;
export type ChangeSide = z.infer<typeof changeSideSchema>;
export type ChangeEntry = z.infer<typeof changeEntrySchema>;
export type ChangeKind = ChangeEntry['kind'];
