<script setup lang="ts">
import { computed, ref } from 'vue';

import ChangeItem from '@/components/changes/ChangeItem.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { formatStamp } from '@/lib/date';
import { CHANGES_FORMS, countOf } from '@/lib/format';
import type { ChangeEntry } from '@/api/DTOs';

const props = defineProps<{ entries: ChangeEntry[] }>();

/*
 * Группировка по прогону, а не по дате занятия.
 *
 * Один прогон выгрузки — это одна порция новостей: деканат правит расписание пачкой, и
 * человеку важно увидеть «вот что изменилось со вчера», а не отдельные правки вразнобой
 * по всему семестру.
 */
const runs = computed(() =>
{
	const byRun = new Map<string, ChangeEntry[]>();

	for (const entry of props.entries)
	{
		const list = byRun.get(entry.detectedAt) ?? [];
		list.push(entry);
		byRun.set(entry.detectedAt, list);
	}

	return [ ...byRun.entries() ].
		sort(([ a ], [ b ]) => b.localeCompare(a)).
		map(([ detectedAt, items ]) => ({
			detectedAt,
			items: [ ...items ].sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind)),
		}));
});

/*
 * По умолчанию раскрыт только самый свежий прогон: их за семестр накопятся десятки, и
 * развёрнутые все сразу — это несколько экранов старых новостей перед сегодняшними.
 *
 * Два множества, а не одно: нужно различать «человек свернул свежий» и «человек раскрыл
 * старый», иначе любое из решений переставало бы действовать при следующей выгрузке,
 * когда индексы прогонов сдвигаются.
 */
const opened = ref(new Set<string>());
const closed = ref(new Set<string>());

function isOpen (detectedAt: string, index: number): boolean
{
	if (opened.value.has(detectedAt)) return true;
	if (closed.value.has(detectedAt)) return false;
	return index === 0;
}

function toggle (detectedAt: string, index: number): void
{
	const next = !isOpen(detectedAt, index);

	opened.value = next ? add(opened.value, detectedAt) : without(opened.value, detectedAt);
	closed.value = next ? without(closed.value, detectedAt) : add(closed.value, detectedAt);
}

function add (set: Set<string>, value: string): Set<string>
{
	return new Set(set).add(value);
}

function without (set: Set<string>, value: string): Set<string>
{
	const next = new Set(set);
	next.delete(value);
	return next;
}
</script>

<template>
	<EmptyState
		v-if="!entries.length"
		title="Изменений пока нет"
		hint="Журнал заполняется сам: как только выгрузка заметит расхождение с прошлым дампом, оно появится здесь."
	/>

	<div v-else class="flex flex-col gap-3">
		<section
			v-for="(run, index) in runs"
			:key="run.detectedAt"
			class="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
		>
			<button
				type="button"
				class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-soft"
				@click="toggle(run.detectedAt, index)"
			>
				<span class="text-[14px] font-semibold text-text">{{ formatStamp(run.detectedAt) }}</span>

				<span class="flex shrink-0 items-center gap-2 text-[12px] text-muted">
					{{ countOf(run.items.length, CHANGES_FORMS) }}
					<svg
						class="size-3.5 transition-transform"
						:class="isOpen(run.detectedAt, index) ? 'rotate-180' : ''"
						viewBox="0 0 14 14"
						fill="none"
						aria-hidden="true"
					>
						<path d="m3.5 5.5 3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
					</svg>
				</span>
			</button>

			<div v-if="isOpen(run.detectedAt, index)" class="divide-y divide-line-soft border-t border-line">
				<ChangeItem
					v-for="(entry, position) in run.items"
					:key="`${entry.date}-${entry.kind}-${position}`"
					:entry="entry"
				/>
			</div>
		</section>
	</div>
</template>
