<script setup lang="ts">
import { computed } from 'vue';

import BeforeAfter from '@/components/changes/BeforeAfter.vue';
import { formatDay, weekdayShort } from '@/lib/date';
import type { ChangeEntry, ChangeKind } from '@/api/DTOs';

const props = defineProps<{ entry: ChangeEntry }>();

const KIND: Record<ChangeKind, { label: string; color: string; wash: string }> = {
	added: { label: 'Добавлено', color: 'var(--added)', wash: 'var(--added-wash)' },
	removed: { label: 'Удалено', color: 'var(--removed)', wash: 'var(--removed-wash)' },
	moved: { label: 'Перенесено', color: 'var(--moved)', wash: 'var(--moved-wash)' },
	edited: { label: 'Изменено', color: 'var(--moved)', wash: 'var(--moved-wash)' },
};

const tone = computed(() => KIND[props.entry.kind]);

/* Заголовок берём с той стороны, которая существует: у добавленной пары нет «до»,
   у удалённой — «после». */
const side = computed(() => props.entry.after ?? props.entry.before);

/* Для добавленной и удалённой пары показывать таблицу «было → стало» нечего:
   одна из колонок в ней была бы пустой по всей высоте. */
const showDiff = computed(() => Boolean(props.entry.before && props.entry.after));

const summary = computed(() =>
{
	const value = side.value;
	if (!value) return '';
	return [ value.type, ...value.teachers, ...value.rooms ].filter(Boolean).join(' · ');
});
</script>

<template>
	<article class="flex flex-col gap-2 px-4 py-3">
		<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
			<span
				class="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
				:style="{ color: tone.color, background: tone.wash }"
			>
				{{ tone.label }}
			</span>

			<span class="text-[13px] font-medium text-text">
				{{ weekdayShort(entry.date) }}, {{ formatDay(entry.date) }}
			</span>

			<span v-if="side" class="tnum text-[13px] text-slate">{{ side.begin }}–{{ side.end }}</span>
		</div>

		<p v-if="side" class="text-[13px] text-body">{{ side.subject }}</p>

		<p v-if="summary && !showDiff" class="text-[12px] text-muted">{{ summary }}</p>

		<BeforeAfter v-if="showDiff" :before="entry.before" :after="entry.after" />
	</article>
</template>
