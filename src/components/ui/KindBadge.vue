<script setup lang="ts">
import { KIND_LABELS, type LessonKind } from '@/lib/lesson';

defineProps<{
	kind: LessonKind;
	/** Полная подпись из API — она точнее, но в таблицу не влезает. */
	title?: string;
}>();

/* Цвет тянем из той же переменной, что и полоска у карточки: тип занятия должен
   опознаваться одинаково во всех четырёх местах, где он показан. */
const TONE: Record<LessonKind, string> = {
	lecture: 'var(--lecture)',
	practice: 'var(--practice)',
	lab: 'var(--lab)',
	exam: 'var(--exam)',
	other: 'var(--other)',
};
</script>

<template>
	<span
		class="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
		:style="{ color: TONE[kind], background: `color-mix(in srgb, ${TONE[kind]} 10%, transparent)` }"
		:title="title"
	>
		{{ KIND_LABELS[kind] }}
	</span>
</template>
