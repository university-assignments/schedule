<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';

import ScheduleToolbar from '@/components/schedule/ScheduleToolbar.vue';
import ScheduleTable from '@/components/schedule/ScheduleTable.vue';
import DayCards from '@/components/schedule/DayCards.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue';
import { useAppData } from '@/composables/useAppData';
import { useFilterQuerySync } from '@/composables/useRouteQuerySync';
import { useDebounced } from '@/composables/useDebounced';
import { applyFilters, isDefaultFilters } from '@/lib/filters';
import { keysChangedInLatestRun } from '@/lib/changes';
import { countOf, LESSONS_FORMS } from '@/lib/format';
import { usePreferencesStore } from '@/stores/preferences';

const { lessons, changes, teachers, group, isLoading, error, refetch } = useAppData();
const preferences = usePreferencesStore();

const filters = useFilterQuerySync();

/*
 * Задержан только поиск, и только при чтении. Само поле остаётся мгновенным, а вот
 * пересборка списка на каждую букву заметна уже на паре сотен занятий.
 */
const search = useDebounced(computed(() => filters.value.search), 200);

const effective = computed(() => ({ ...filters.value, search: search.value }));

const mySubjects = computed(() => preferences.subjectsOfGroup(group.value?.id ?? ''));

const visible = computed(() => applyFilters(lessons.value, effective.value, mySubjects.value));

/* Подсвечены только пары из последней выгрузки: подсветка, которая горит всегда,
   перестаёт что-либо значить уже к середине семестра. */
const changedKeys = computed(() => keysChangedInLatestRun(changes.value));

/* Карточки вместо таблицы решает ширина экрана, а не тип устройства: на планшете в
   альбомной ориентации таблица помещается целиком и читается лучше. */
const isWide = useMediaQuery('(min-width: 768px)');

/*
 * Границы дампа — ими ограничен календарь своего диапазона. Расписание кончается 23
 * декабря, и листать в нём март значит выбирать заведомо пустой отрезок.
 *
 * Считаем по всем занятиям, а не по отфильтрованным: сузив выбор до одного преподавателя,
 * человек не должен терять возможность заглянуть в декабрь.
 */
const dataFrom = computed(() => lessons.value[0]?.date);
const dataTo = computed(() => lessons.value.at(-1)?.date);

const emptyHint = computed(() =>
{
	if (!lessons.value.length) return 'Дамп расписания для этой группы ещё не выгружен.';
	/* Пустой промежуток — обычное дело (каникулы, сессия), и подсказка должна вести к
	   тому органу управления, которым его и выбрали: к полям дат или к стрелкам. */
	if (filters.value.period === 'custom') return 'В выбранном промежутке занятий нет — измените даты.';
	if (!isDefaultFilters(filters.value)) return 'Под фильтры ничего не подошло — попробуйте сбросить их или расширить период.';

	return 'На этой неделе занятий нет — полистайте стрелками или переключите период.';
});
</script>

<template>
	<div class="flex flex-col gap-4">
		<ScheduleToolbar
			v-model="filters"
			:teachers="teachers"
			:has-my-subjects="mySubjects.length > 0"
			:show-columns="isWide"
			:min-date="dataFrom"
			:max-date="dataTo"
		/>

		<ErrorState v-if="error" :error="error" @retry="refetch" />

		<SkeletonBlock v-else-if="isLoading" :rows="8" />

		<EmptyState v-else-if="!visible.length" title="Пар нет" :hint="emptyHint" />

		<template v-else>
			<ScheduleTable v-if="isWide" :lessons="visible" :changed="changedKeys" />
			<DayCards v-else :lessons="visible" :changed="changedKeys" />

			<p class="text-[12px] text-muted">
				{{ countOf(visible.length, LESSONS_FORMS) }}
				<span v-if="visible.length !== lessons.length">из {{ lessons.length }}</span>
			</p>
		</template>
	</div>
</template>
