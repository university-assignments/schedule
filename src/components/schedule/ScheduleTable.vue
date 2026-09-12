<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useTable, type SortingState } from '@tanstack/vue-table';

import LessonCells from '@/components/schedule/LessonCells.vue';
import { formatDayHeading, today } from '@/lib/date';
import { keyOfLesson } from '@/lib/changes';
import { scheduleColumns, scheduleFeatures, ALIGN_END } from '@/lib/table';
import { ALL_COLUMNS, COLUMN_LABELS, usePreferencesStore, type ColumnId } from '@/stores/preferences';
import type { Lesson } from '@/lib/lesson';

const props = defineProps<{
	lessons: Lesson[];
	/** Ключи пар, задетых последней выгрузкой (см. lib/changes). */
	changed: Set<string>;
}>();

const preferences = usePreferencesStore();

const sorting = ref<SortingState>([]);

/*
 * Хранилище держит СПРЯТАННЫЕ колонки, а таблица хочет карту видимости целиком.
 * Список спрятанных короче и, главное, устойчив к добавлению колонки: новая появится
 * у всех, а не останется выключенной у тех, кто открывал страницу раньше.
 */
const columnVisibility = computed(() => Object.fromEntries(ALL_COLUMNS.map((id) => [ id, !preferences.hiddenColumns.includes(id) ])));

const table = useTable({
	features: scheduleFeatures,
	columns: scheduleColumns,
	data: toRef(() => props.lessons),
	getRowId: (lesson: Lesson) => lesson.id,
	state: computed(() => ({ sorting: sorting.value, columnVisibility: columnVisibility.value })),
	onSortingChange: (updater) =>
	{
		sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater;
	},
});

const columns = computed(() => table.getVisibleLeafColumns().map((column) => column.id as ColumnId));
const rows = computed(() => table.getRowModel().rows.map((row) => row.original));

/*
 * Два режима показа, и переключает их сама сортировка.
 *
 * По умолчанию строки собраны в дни: расписание читают днями, и заголовок «Ср, 3 сент.»
 * заменяет собой повторение даты в каждой строке. Но стоит человеку отсортировать по
 * преподавателю — группировка по дате теряет смысл (он как раз и хочет увидеть все пары
 * подряд), поэтому таблица становится плоской.
 *
 * Это дешевле и честнее, чем getGroupedRowModel: группировка по дням здесь не фича
 * таблицы, а способ чтения, и она не должна выживать после сортировки по чужой колонке.
 */
const days = computed(() =>
{
	if (sorting.value.length) return null;

	const byDate = new Map<string, Lesson[]>();
	for (const lesson of rows.value)
	{
		const list = byDate.get(lesson.date) ?? [];
		list.push(lesson);
		byDate.set(lesson.date, list);
	}

	return [ ...byDate.entries() ].map(([ date, items ]) => ({ date, items }));
});

const now = today();

function sortBy (columnId: ColumnId): void
{
	const current = sorting.value[0];

	/* Третий клик возвращает группировку по дням, а не третий вариант сортировки:
	   «как было» — то состояние, к которому людям чаще всего и надо вернуться. */
	if (current?.id !== columnId) sorting.value = [{ id: columnId, desc: false }];
	else if (!current.desc) sorting.value = [{ id: columnId, desc: true }];
	else sorting.value = [];
}

function arrow (columnId: ColumnId): string
{
	const current = sorting.value[0];
	if (current?.id !== columnId) return '';
	return current.desc ? ' ↓' : ' ↑';
}
</script>

<template>
	<div class="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
		<table class="w-full min-w-[44rem] border-collapse">
			<thead>
				<tr class="border-b border-line">
					<th
						v-for="column in columns"
						:key="column"
						scope="col"
						class="px-3 py-2.5 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
						:class="ALIGN_END.includes(column) ? 'text-right' : 'text-left'"
					>
						<button
							type="button"
							class="transition-colors hover:text-body"
							:class="sorting[0]?.id === column ? 'text-accent-ink' : ''"
							@click="sortBy(column)"
						>
							{{ COLUMN_LABELS[column] }}{{ arrow(column) }}
						</button>
					</th>
				</tr>
			</thead>

			<!-- Сгруппированный вид: заголовок дня отдельной строкой на всю ширину. -->
			<template v-if="days">
				<tbody v-for="day in days" :key="day.date" class="border-b border-line last:border-0">
					<tr class="bg-surface-soft">
						<th
							:colspan="columns.length"
							scope="colgroup"
							class="px-3 py-1.5 text-left text-[12px] font-semibold"
							:class="day.date === now ? 'text-accent-ink' : 'text-slate'"
						>
							{{ formatDayHeading(day.date) }}
							<span v-if="day.date === now" class="ml-1 text-[11px] font-normal">сегодня</span>
						</th>
					</tr>

					<tr
						v-for="lesson in day.items"
						:key="lesson.id"
						class="border-t border-line-soft"
						:class="changed.has(keyOfLesson(lesson)) ? 'bg-moved-wash' : ''"
					>
						<LessonCells
							:lesson="lesson"
							:columns="columns"
							:changed="changed.has(keyOfLesson(lesson))"
						/>
					</tr>
				</tbody>
			</template>

			<!-- Плоский вид: включается сортировкой по колонке. -->
			<tbody v-else>
				<tr
					v-for="lesson in rows"
					:key="lesson.id"
					class="border-t border-line-soft"
					:class="changed.has(keyOfLesson(lesson)) ? 'bg-moved-wash' : ''"
				>
					<LessonCells
						:lesson="lesson"
						:columns="columns"
						:changed="changed.has(keyOfLesson(lesson))"
					/>
				</tr>
			</tbody>
		</table>
	</div>
</template>
