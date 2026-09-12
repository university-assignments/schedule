import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';

import { useChangesQuery, useMeta, useGroups, useScheduleQuery } from '@/queries/useSchedule';
import { useCurrentGroup } from '@/composables/useCurrentGroup';
import { subjectsOf, teachersOf, type Lesson } from '@/lib/lesson';
import { usePreferencesStore } from '@/stores/preferences';
import type { ChangeEntry, Group } from '@/api/DTOs';

/*
 * Общие данные страницы — один раз на всё приложение.
 *
 * vue-query сам дедуплицирует запросы по ключу, так что дважды вызвать useMeta() было бы
 * безвредно для сети. А вот useCurrentGroup() безвреден не был бы: он следит за группой и
 * дописывает её в адресную строку, и два таких наблюдателя писали бы в router по очереди.
 * Поэтому запросы заводятся ровно раз, в App.vue, и раздаются через provide/inject.
 */

export interface AppData
{
	groups: ComputedRef<Group[]>;
	group: ComputedRef<Group | null>;
	selectGroup: (slug: string) => void;

	lessons: ComputedRef<Lesson[]>;
	changes: ComputedRef<ChangeEntry[]>;
	teachers: ComputedRef<string[]>;
	subjects: ComputedRef<string[]>;

	updatedAt: ComputedRef<string | null>;
	unseenChanges: ComputedRef<number>;

	isLoading: ComputedRef<boolean>;
	error: ComputedRef<unknown>;
	refetch: () => void;
}

const KEY: InjectionKey<AppData> = Symbol('app-data');

export function provideAppData (): AppData
{
	const preferences = usePreferencesStore();

	const meta = useMeta();

	/* Версия всего репозитория — ею помечены списки групп: они меняются реже всего. */
	const repoVersion = computed(() => meta.data.value?.updatedAt ?? null);
	const groupsQuery = useGroups(repoVersion);

	const { current, select } = useCurrentGroup(() => groupsQuery.data.value);
	const groupId = computed(() => current.value?.id ?? null);

	/*
	 * Версия конкретной группы, а не общая. Прогон мог обновить одну группу и не тронуть
	 * вторую; общая версия сбрасывала бы кэш у обеих и заставляла браузер тянуть файлы,
	 * которые не изменились.
	 */
	const groupVersion = computed(() =>
	{
		const id = groupId.value;
		if (!id) return repoVersion.value;
		return meta.data.value?.groups[id]?.updatedAt ?? repoVersion.value;
	});

	const scheduleQuery = useScheduleQuery(groupId, groupVersion);
	const changesQuery = useChangesQuery(groupId, groupVersion);

	const lessons = computed(() => scheduleQuery.data.value ?? []);
	const changes = computed(() => changesQuery.data.value ?? []);

	const data: AppData = {
		groups: computed(() => groupsQuery.data.value ?? []),
		group: current,
		selectGroup: select,

		lessons,
		changes,
		teachers: computed(() => teachersOf(lessons.value)),
		subjects: computed(() => subjectsOf(lessons.value)),

		updatedAt: groupVersion,
		unseenChanges: computed(() =>
		{
			const id = groupId.value;
			if (!id) return 0;
			return preferences.unseenCount(id, changes.value.map((entry) => entry.detectedAt));
		}),

		/* Скелет показываем только пока НЕЧЕГО показывать. Фоновое обновление по фокусу
		   вкладки не должно сбрасывать уже нарисованную таблицу в серые полоски. */
		isLoading: computed(() => meta.isPending.value || groupsQuery.isPending.value || scheduleQuery.isPending.value),
		error: computed(() => meta.error.value ?? groupsQuery.error.value ?? scheduleQuery.error.value),
		refetch: () =>
		{
			void meta.refetch();
			void groupsQuery.refetch();
			void scheduleQuery.refetch();
			void changesQuery.refetch();
		},
	};

	provide(KEY, data);
	return data;
}

export function useAppData (): AppData
{
	const data = inject(KEY);
	if (!data) throw new Error('useAppData() вызван вне App.vue — данные не предоставлены');
	return data;
}
