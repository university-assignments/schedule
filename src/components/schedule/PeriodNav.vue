<script setup lang="ts">
import { computed } from 'vue';

import { coversToday, isSteppable, rangeLabel, shiftAnchor, type FilterState } from '@/lib/filters';
import { today } from '@/lib/date';

const filters = defineModel<FilterState>({ required: true });

const props = defineProps<{
	/** Границы имеющихся данных: за ними расписания нет, и предлагать их в календаре незачем. */
	min?: string;
	max?: string;
}>();

/*
 * Переключатель показываемого отрезка времени. Два несхожих режима в одном месте, и это
 * намеренно: и стрелки, и поля дат отвечают на один вопрос «за какие числа показывать»,
 * а разнеси их по разным углам — человек искал бы, где переключается то, что он только
 * что видел.
 */
const steppable = computed(() => isSteppable(filters.value.period));
const custom = computed(() => filters.value.period === 'custom');

const label = computed(() => rangeLabel(filters.value));

/* «Сегодня» показываем, только когда текущий день ушёл из видимого периода: постоянная
   кнопка, которая обычно ничего не делает, лишь занимает место в шапке на телефоне. */
const showToday = computed(() => steppable.value && !coversToday(filters.value));

function shift (direction: -1 | 1): void
{
	filters.value = {
		...filters.value,
		anchor: shiftAnchor(filters.value.period, filters.value.anchor, direction),
	};
}

function goToday (): void
{
	filters.value = { ...filters.value, anchor: today() };
}

const from = computed({
	get: () => filters.value.from,
	set: (value: string) =>
	{
		filters.value = { ...filters.value, from: value };
	},
});

const to = computed({
	get: () => filters.value.to,
	set: (value: string) =>
	{
		filters.value = { ...filters.value, to: value };
	},
});

/*
 * Календарь ограничиваем И данными, И второй границей.
 *
 * Ограничение по данным честнее пустой таблицы: расписание кончается 23 декабря, и
 * пролистывать календарь до марта незачем. Ограничение по второй границе убирает
 * перевёрнутый диапазон в самом частом сценарии — выбором мышью его уже не составить
 * (а набранный руками всё равно разворачивается в customRange, см. lib/filters).
 */
const fromMax = computed(() => clampEnd(filters.value.to, props.max));
const toMin = computed(() => clampStart(filters.value.from, props.min));

function clampEnd (a?: string, b?: string): string | undefined
{
	if (a && b) return a < b ? a : b;
	return a || b;
}

function clampStart (a?: string, b?: string): string | undefined
{
	if (a && b) return a > b ? a : b;
	return a || b;
}
</script>

<template>
	<div class="flex flex-wrap items-center gap-1">
		<template v-if="steppable">
			<button
				type="button"
				class="rounded-lg border border-line bg-surface p-2 text-slate transition-colors hover:bg-surface-soft hover:text-body"
				aria-label="Назад"
				@click="shift(-1)"
			>
				<svg class="size-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
					<path d="M8.5 3.5 5 7l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				</svg>
			</button>

			<!-- Подпись кликабельна и возвращает на сегодня: попасть в неё пальцем проще,
			     чем в отдельную кнопку, а смысл тот же. -->
			<button
				type="button"
				class="min-w-[8.5rem] rounded-lg px-2 py-1.5 text-center text-[13px] font-medium whitespace-nowrap transition-colors"
				:class="showToday ? 'text-body hover:bg-surface-soft' : 'text-text'"
				:title="showToday ? 'Вернуться к текущей дате' : undefined"
				@click="goToday"
			>
				{{ label }}
			</button>

			<button
				type="button"
				class="rounded-lg border border-line bg-surface p-2 text-slate transition-colors hover:bg-surface-soft hover:text-body"
				aria-label="Вперёд"
				@click="shift(1)"
			>
				<svg class="size-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
					<path d="M5.5 3.5 9 7l-3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				</svg>
			</button>

			<button
				v-if="showToday"
				type="button"
				class="rounded-lg border border-accent-line bg-accent-wash px-2.5 py-1.5 text-[13px] text-accent-ink transition-opacity hover:opacity-80"
				@click="goToday"
			>
				Сегодня
			</button>
		</template>

		<template v-else-if="custom">
			<label class="flex items-center gap-1.5 text-[13px] text-muted">
				с
				<input
					v-model="from"
					type="date"
					:min="props.min"
					:max="fromMax"
					class="rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] text-body focus:border-accent-line focus:outline-none"
				>
			</label>

			<label class="flex items-center gap-1.5 text-[13px] text-muted">
				по
				<input
					v-model="to"
					type="date"
					:min="toMin"
					:max="props.max"
					class="rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] text-body focus:border-accent-line focus:outline-none"
				>
			</label>

			<!-- Очистка каждой границы по отдельности: «с 1 декабря и до конца» — это
			     пустое второе поле, а не выдуманная дата на год вперёд. -->
			<button
				v-if="from || to"
				type="button"
				class="rounded-lg px-2 py-1.5 text-[12px] text-slate transition-colors hover:bg-surface-soft hover:text-body"
				@click="filters = { ...filters, from: '', to: '' }"
			>
				Очистить
			</button>
		</template>
	</div>
</template>
