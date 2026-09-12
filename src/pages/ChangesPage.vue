<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';

import ChangeList from '@/components/changes/ChangeList.vue';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue';
import { useAppData } from '@/composables/useAppData';
import { useFilterQuerySync } from '@/composables/useRouteQuerySync';
import { usePreferencesStore } from '@/stores/preferences';
import { CHANGES_FORMS, countOf } from '@/lib/format';

const { changes, group, isLoading, error, refetch } = useAppData();
const preferences = usePreferencesStore();

/* Тот же объект фильтров, что и у расписания: из всего набора здесь осмыслен один
   тумблер, но состояние общее — переключившись на вкладку и обратно, человек находит
   свои фильтры на месте. */
const filters = useFilterQuerySync();

const onlyMine = computed({
	get: () => filters.value.onlyMine,
	set: (value: boolean) =>
	{
		filters.value = { ...filters.value, onlyMine: value };
	},
});

const mySubjects = computed(() => new Set(preferences.subjectsOfGroup(group.value?.id ?? '')));

/*
 * Отбор по предмету, а не через applyFilters: у записи журнала нет ни типа занятия, ни
 * преподавателя в том же виде, что у пары, и период тут вреден — правку на октябрь
 * показать надо, даже если открыта текущая неделя.
 */
const visible = computed(() =>
{
	if (!onlyMine.value || mySubjects.value.size === 0) return changes.value;

	return changes.value.filter((entry) =>
	{
		const subject = entry.after?.subject ?? entry.before?.subject ?? '';
		return mySubjects.value.has(subject);
	});
});

/*
 * Отметка «прочитано» ставится при УХОДЕ со страницы, а не при входе.
 *
 * Поставь её сразу — бейдж потух бы в тот же миг, и человек, открывший вкладку случайно,
 * потерял бы единственный признак, что новости вообще были. Уход же означает, что список
 * он увидел.
 */
// Закрытие вкладки — тоже уход, а onUnmounted при нём не вызывается.
onMounted(() => window.addEventListener('pagehide', markSeen));

onUnmounted(() =>
{
	window.removeEventListener('pagehide', markSeen);
	markSeen();
});

function markSeen (): void
{
	const latest = changes.value[0]?.detectedAt;
	preferences.markChangesSeen(group.value?.id ?? '', latest);
}
</script>

<template>
	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-[13px] text-slate">
				{{ countOf(visible.length, CHANGES_FORMS) }}
				<span v-if="visible.length !== changes.length" class="text-muted">из {{ changes.length }}</span>
			</p>

			<ToggleSwitch v-model="onlyMine" label="Только мои предметы" />
		</div>

		<ErrorState v-if="error" :error="error" @retry="refetch" />
		<SkeletonBlock v-else-if="isLoading" :rows="5" />
		<ChangeList v-else :entries="visible" />
	</div>
</template>
