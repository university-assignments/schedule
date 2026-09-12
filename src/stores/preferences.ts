import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { readJson, writeJson } from '@/lib/persist';

/*
 * Настройки человека: что он считает «своим» и как ему удобно смотреть таблицу.
 *
 * Всё это НЕ уезжает в адресную строку — в отличие от фильтров. Разница принципиальная:
 * фильтры описывают вид, которым делятся («смотри, что во вторник»), а здесь лежит
 * личное. Кинь человек ссылку однокурснику из другой подгруппы — тот получил бы чужой
 * список предметов поверх своего и даже не заметил бы подмены.
 *
 * Ключи версионированы (:v1): добавится колонка — старая сохранённая настройка не
 * должна прятать её у тех, кто открывал страницу раньше.
 */

const KEY_GROUP = 'schedule:group:v1';
const KEY_SUBJECTS = 'schedule:my-subjects:v1';
const KEY_SEEN = 'schedule:changes-seen:v1';
const KEY_COLUMNS = 'schedule:columns:v1';

export const ALL_COLUMNS = [ 'date', 'slot', 'time', 'subject', 'kind', 'teachers', 'rooms' ] as const;
export type ColumnId = typeof ALL_COLUMNS[number];

export const COLUMN_LABELS: Record<ColumnId, string> = {
	date: 'Дата',
	slot: '№',
	time: 'Время',
	subject: 'Предмет',
	kind: 'Тип',
	teachers: 'Преподаватель',
	rooms: 'Аудитория',
};

/* Дату по умолчанию прячем: строки и так сгруппированы по дням, и в каждой ячейке
   повторялось бы то, что уже написано в заголовке группы. */
const DEFAULT_HIDDEN: ColumnId[] = [ 'date' ];

export const usePreferencesStore = defineStore('preferences', () =>
{
	const groupSlug = ref<string>(readJson<string>(KEY_GROUP, ''));

	/*
	 * Предметы хранятся по группам, а не общим списком: человек, который заглядывает в
	 * расписание соседнего потока, не должен получить там «свои пары» от собственной
	 * группы — совпадение названий предметов между потоками как раз обычное дело.
	 */
	const mySubjects = ref<Record<string, string[]>>(readJson(KEY_SUBJECTS, {}));

	/** Отметка «до сюда журнал изменений прочитан» — по ней считается бейдж. */
	const changesSeenAt = ref<Record<string, string>>(readJson(KEY_SEEN, {}));

	const hiddenColumns = ref<ColumnId[]>(readJson<ColumnId[]>(KEY_COLUMNS, DEFAULT_HIDDEN));

	watch(groupSlug, (value) => writeJson(KEY_GROUP, value));
	watch(mySubjects, (value) => writeJson(KEY_SUBJECTS, value), { deep: true });
	watch(changesSeenAt, (value) => writeJson(KEY_SEEN, value), { deep: true });
	watch(hiddenColumns, (value) => writeJson(KEY_COLUMNS, value), { deep: true });

	const visibleColumns = computed<ColumnId[]>(() => ALL_COLUMNS.filter((id) => !hiddenColumns.value.includes(id)));

	function subjectsOfGroup (groupId: string): string[]
	{
		return mySubjects.value[groupId] ?? [];
	}

	function setSubjects (groupId: string, subjects: string[]): void
	{
		mySubjects.value = { ...mySubjects.value, [groupId]: subjects };
	}

	function toggleColumn (id: ColumnId): void
	{
		hiddenColumns.value = hiddenColumns.value.includes(id)
			? hiddenColumns.value.filter((item) => item !== id)
			: [ ...hiddenColumns.value, id ];
	}

	function resetColumns (): void
	{
		hiddenColumns.value = [ ...DEFAULT_HIDDEN ];
	}

	/**
	 * Сколько правок человек ещё не видел.
	 *
	 * Считается по detectedAt, а не по количеству записей: журнал только дописывается,
	 * и «стало на три больше, чем в прошлый раз» сбилось бы навсегда, открой человек
	 * страницу с другого устройства.
	 */
	function unseenCount (groupId: string, detectedAt: string[]): number
	{
		const seen = changesSeenAt.value[groupId];
		if (!seen) return detectedAt.length;
		return detectedAt.filter((stamp) => stamp > seen).length;
	}

	function markChangesSeen (groupId: string, latest: string | undefined): void
	{
		if (!latest) return;
		changesSeenAt.value = { ...changesSeenAt.value, [groupId]: latest };
	}

	return {
		groupSlug,
		mySubjects,
		hiddenColumns,
		visibleColumns,
		subjectsOfGroup,
		setSubjects,
		toggleColumn,
		resetColumns,
		unseenCount,
		markChangesSeen,
	};
});
