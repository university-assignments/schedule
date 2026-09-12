<script setup lang="ts">
import { computed } from 'vue';

import KindBadge from '@/components/ui/KindBadge.vue';
import { formatDayHeading, today } from '@/lib/date';
import { keyOfLesson } from '@/lib/changes';
import type { Lesson, LessonKind } from '@/lib/lesson';

const props = defineProps<{
	lessons: Lesson[];
	changed: Set<string>;
}>();

/*
 * Мобильный вид. Таблица с семью колонками на экране в 375 точек требует горизонтальной
 * прокрутки, а расписание смотрят как раз с телефона и в коридоре — поэтому здесь не
 * ужатая таблица, а карточки: день, время, предмет, под ним преподаватель и аудитория.
 */
const days = computed(() =>
{
	const byDate = new Map<string, Lesson[]>();

	for (const lesson of props.lessons)
	{
		const list = byDate.get(lesson.date) ?? [];
		list.push(lesson);
		byDate.set(lesson.date, list);
	}

	return [ ...byDate.entries() ].map(([ date, items ]) => ({ date, items }));
});

const now = today();

const STRIPE: Record<LessonKind, string> = {
	lecture: 'var(--lecture)',
	practice: 'var(--practice)',
	lab: 'var(--lab)',
	exam: 'var(--exam)',
	other: 'var(--other)',
};
</script>

<template>
	<div class="flex flex-col gap-3">
		<section
			v-for="day in days"
			:key="day.date"
			class="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
		>
			<h2
				class="border-b border-line bg-surface-soft px-3 py-2 text-[13px] font-semibold"
				:class="day.date === now ? 'text-accent-ink' : 'text-slate'"
			>
				{{ formatDayHeading(day.date) }}
				<span v-if="day.date === now" class="ml-1 text-[11px] font-normal">сегодня</span>
			</h2>

			<article
				v-for="lesson in day.items"
				:key="lesson.id"
				class="flex gap-3 border-b border-line-soft px-3 py-2.5 last:border-0"
				:class="changed.has(keyOfLesson(lesson)) ? 'bg-moved-wash' : ''"
			>
				<div class="w-1 shrink-0 rounded-full" :style="{ background: STRIPE[lesson.kind] }" />

				<div class="flex min-w-0 flex-1 flex-col gap-1">
					<div class="flex items-baseline gap-2">
						<span class="tnum text-[13px] font-medium whitespace-nowrap text-body">
							{{ lesson.begin }}–{{ lesson.end }}
						</span>
						<span v-if="lesson.slot" class="text-[11px] text-muted">{{ lesson.slot }}-я</span>
						<span
							v-if="lesson.hasConflict"
							class="text-[11px] text-muted"
							title="В это же время стоит ещё одна пара — вероятно, подгруппы"
						>
							⇄
						</span>
					</div>

					<p class="text-[13px] leading-snug font-medium text-text">{{ lesson.subject }}</p>

					<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate">
						<KindBadge :kind="lesson.kind" :title="lesson.kindLabel" />
						<span v-if="lesson.teachers.length">{{ lesson.teachers.join(', ') }}</span>
						<span v-if="lesson.rooms.length" class="text-muted">{{ lesson.rooms.join(', ') }}</span>
					</div>
				</div>
			</article>
		</section>
	</div>
</template>
