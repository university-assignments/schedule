<script setup lang="ts">
import { computed } from 'vue';

import { coversToday, rangeLabel, shiftAnchor, type Period } from '@/lib/filters';
import { today } from '@/lib/date';

const props = defineProps<{
	period: Period;
	anchor: string;
}>();

const emit = defineEmits<{ 'update:anchor': [ date: string ] }>();

/* В режиме «Всё» листать нечего: границ у периода нет, и стрелки двигали бы точку
   отсчёта, ничего не меняя на экране. */
const navigable = computed(() => props.period !== 'all');

const label = computed(() => rangeLabel(props.period, props.anchor));

/* «Сегодня» показываем, только когда текущий день ушёл из видимого периода: постоянная
   кнопка, которая обычно ничего не делает, лишь занимает место в шапке на телефоне. */
const showToday = computed(() => navigable.value && !coversToday(props.period, props.anchor));

function shift (direction: -1 | 1): void
{
	emit('update:anchor', shiftAnchor(props.period, props.anchor, direction));
}
</script>

<template>
	<div v-if="navigable" class="flex items-center gap-1">
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
			@click="emit('update:anchor', today())"
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
			@click="emit('update:anchor', today())"
		>
			Сегодня
		</button>
	</div>
</template>
