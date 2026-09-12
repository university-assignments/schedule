<script setup lang="ts">
import { computed, ref } from 'vue';

import SearchField from '@/components/ui/SearchField.vue';
import KindBadge from '@/components/ui/KindBadge.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue';
import { useAppData } from '@/composables/useAppData';
import { formatDay, weekdayShort } from '@/lib/date';
import { countOf, LESSONS_FORMS } from '@/lib/format';
import type { Lesson } from '@/lib/lesson';

const { lessons, isLoading, error, refetch } = useAppData();

/*
 * Взгляд со стороны преподавателя.
 *
 * Вся его нагрузка и так видна на сайте университета — здесь смысл ровно в обратном:
 * показать только те его пары, которые касаются ЭТОЙ группы. «Когда у нас Соколов и что
 * он ведёт» — вопрос, на который расписание по дням отвечает долгим пролистыванием.
 */
const needle = ref('');

interface TeacherCard
{
	name: string;
	lessons: Lesson[];
	subjects: string[];
	/** Дни недели, в которые он приходит к группе, — в порядке пн…вс. */
	weekdays: string[];
}

const cards = computed<TeacherCard[]>(() =>
{
	const byTeacher = new Map<string, Lesson[]>();

	for (const lesson of lessons.value)
	{
		for (const name of lesson.teachers)
		{
			const list = byTeacher.get(name) ?? [];
			list.push(lesson);
			byTeacher.set(name, list);
		}
	}

	return [ ...byTeacher.entries() ].
		map(([ name, items ]) => ({
			name,
			lessons: items,
			subjects: [ ...new Set(items.map((lesson) => lesson.subject)) ].sort((a, b) => a.localeCompare(b, 'ru')),
			weekdays: [ ...new Set(items.map((lesson) => lesson.weekday)) ].
				sort((a, b) => a - b).
				map((weekday) => weekdayShort(items.find((lesson) => lesson.weekday === weekday)!.date)),
		})).
		sort((a, b) => a.name.localeCompare(b.name, 'ru'));
});

const visible = computed(() =>
{
	const query = needle.value.trim().toLowerCase();
	if (!query) return cards.value;

	return cards.value.filter((card) => card.name.toLowerCase().includes(query)
		|| card.subjects.some((subject) => subject.toLowerCase().includes(query)));
});

const expanded = ref<string[]>([]);

function toggle (name: string): void
{
	expanded.value = expanded.value.includes(name)
		? expanded.value.filter((item) => item !== name)
		: [ ...expanded.value, name ];
}
</script>

<template>
	<div class="flex flex-col gap-4">
		<SearchField v-model="needle" placeholder="Фамилия или предмет" />

		<ErrorState v-if="error" :error="error" @retry="refetch" />
		<SkeletonBlock v-else-if="isLoading" :rows="6" />

		<EmptyState
			v-else-if="!visible.length"
			title="Никого не нашлось"
			hint="Здесь только те преподаватели, которые ведут пары у выбранной группы."
		/>

		<div v-else class="flex flex-col gap-2">
			<section
				v-for="card in visible"
				:key="card.name"
				class="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
			>
				<button
					type="button"
					class="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-surface-soft"
					@click="toggle(card.name)"
				>
					<div class="flex w-full items-baseline justify-between gap-3">
						<span class="text-[14px] font-semibold text-text">{{ card.name }}</span>
						<span class="shrink-0 text-[12px] text-muted">{{ countOf(card.lessons.length, LESSONS_FORMS) }}</span>
					</div>

					<p class="text-[12px] text-slate">{{ card.subjects.join(' · ') }}</p>
					<p class="text-[12px] text-muted">{{ card.weekdays.join(', ') }}</p>
				</button>

				<ul v-if="expanded.includes(card.name)" class="divide-y divide-line-soft border-t border-line">
					<li
						v-for="lesson in card.lessons"
						:key="lesson.id"
						class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2 text-[13px]"
					>
						<span class="w-28 shrink-0 text-slate">{{ weekdayShort(lesson.date) }}, {{ formatDay(lesson.date) }}</span>
						<span class="tnum w-24 shrink-0 text-body">{{ lesson.begin }}–{{ lesson.end }}</span>
						<KindBadge :kind="lesson.kind" :title="lesson.kindLabel" />
						<span class="min-w-0 flex-1 text-body">{{ lesson.subject }}</span>
						<span class="shrink-0 text-muted">{{ lesson.rooms.join(', ') }}</span>
					</li>
				</ul>
			</section>
		</div>
	</div>
</template>
