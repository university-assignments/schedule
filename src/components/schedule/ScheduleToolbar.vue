<script setup lang="ts">
import { computed } from 'vue';

import SearchField from '@/components/ui/SearchField.vue';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';
import TeacherFilter from '@/components/schedule/TeacherFilter.vue';
import ColumnMenu from '@/components/schedule/ColumnMenu.vue';
import { emptyFilters, isDefaultFilters, PERIOD_LABELS, type FilterState, type Period } from '@/lib/filters';
import { KIND_LABELS, type LessonKind } from '@/lib/lesson';

const filters = defineModel<FilterState>({ required: true });

const props = defineProps<{
	teachers: string[];
	/** Есть ли у человека отмеченные предметы — иначе тумблер «только мои» обманчив. */
	hasMySubjects: boolean;
	/** Показывать ли меню колонок: в карточном виде на телефоне колонок нет. */
	showColumns: boolean;
}>();

const PERIODS = Object.keys(PERIOD_LABELS) as Period[];
const KINDS = Object.keys(KIND_LABELS) as LessonKind[];

const TONE: Record<LessonKind, string> = {
	lecture: 'var(--lecture)',
	practice: 'var(--practice)',
	lab: 'var(--lab)',
	exam: 'var(--exam)',
	other: 'var(--other)',
};

const dirty = computed(() => !isDefaultFilters(filters.value));

function toggleKind (kind: LessonKind): void
{
	filters.value = {
		...filters.value,
		kinds: filters.value.kinds.includes(kind)
			? filters.value.kinds.filter((item) => item !== kind)
			: [ ...filters.value.kinds, kind ],
	};
}

function setPeriod (period: Period): void
{
	filters.value = { ...filters.value, period };
}

const searchModel = computed({
	get: () => filters.value.search,
	set: (value: string) =>
	{
		filters.value = { ...filters.value, search: value };
	},
});

const teachersModel = computed({
	get: () => filters.value.teachers,
	set: (value: string[]) =>
	{
		filters.value = { ...filters.value, teachers: value };
	},
});

const onlyMineModel = computed({
	get: () => filters.value.onlyMine,
	set: (value: boolean) =>
	{
		filters.value = { ...filters.value, onlyMine: value };
	},
});
</script>

<template>
	<div class="flex flex-col gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<SearchField v-model="searchModel" placeholder="Предмет, преподаватель, аудитория" />

			<TeacherFilter v-model="teachersModel" :teachers="props.teachers" />

			<!-- Период — сегментированный переключатель: вариантов четыре, они
			     взаимоисключающие, и один из них выбран всегда. -->
			<div class="flex gap-0.5 rounded-lg bg-line-soft p-0.5">
				<button
					v-for="period in PERIODS"
					:key="period"
					type="button"
					class="rounded-md px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors"
					:class="filters.period === period ? 'bg-surface text-text shadow-[var(--shadow)]' : 'text-slate hover:text-body'"
					@click="setPeriod(period)"
				>
					{{ PERIOD_LABELS[period] }}
				</button>
			</div>

			<ColumnMenu v-if="props.showColumns" />
		</div>

		<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
			<!-- Типы занятий — чипы, а не выпадающий список: их пять, они всегда одни и те
			     же, и чаще всего человек выключает ровно одну лекцию. -->
			<div class="flex flex-wrap gap-1.5">
				<button
					v-for="kind in KINDS"
					:key="kind"
					type="button"
					class="rounded-full border px-2.5 py-1 text-[12px] transition-colors"
					:style="filters.kinds.includes(kind)
						? { color: TONE[kind], borderColor: TONE[kind], background: `color-mix(in srgb, ${TONE[kind]} 10%, transparent)` }
						: undefined"
					:class="filters.kinds.includes(kind) ? '' : 'border-line text-slate hover:bg-surface-soft'"
					@click="toggleKind(kind)"
				>
					{{ KIND_LABELS[kind] }}
				</button>
			</div>

			<ToggleSwitch v-model="onlyMineModel" label="Только мои" />

			<p v-if="onlyMineModel && !props.hasMySubjects" class="text-[12px] text-moved">
				Предметы не отмечены — откройте «Мои пары» в шапке.
			</p>

			<button
				v-if="dirty"
				type="button"
				class="ml-auto text-[12px] text-slate underline-offset-2 transition-colors hover:text-body hover:underline"
				@click="filters = emptyFilters()"
			>
				Сбросить фильтры
			</button>
		</div>
	</div>
</template>
