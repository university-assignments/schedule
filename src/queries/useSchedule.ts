import { computed, type ComputedRef, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';

import { fetchChanges, fetchGroups, fetchMeta, fetchSchedule } from '@/api/schedule';
import { queryKeys } from '@/queries/keys';
import { normalize, type Lesson } from '@/lib/lesson';
import type { ChangeEntry, Group } from '@/api/DTOs';

/*
 * meta.json — корень всей загрузки: из него берётся версия, а без версии нельзя
 * запрашивать дампы (иначе кэш Pages отдаст вчерашний файл под сегодняшним адресом).
 * Поэтому staleTime здесь нулевой, а остальные запросы включаются только после него.
 */
export function useMeta ()
{
	return useQuery({
		queryKey: queryKeys.meta,
		queryFn: fetchMeta,
		staleTime: 0,
		/* Вкладку держат открытой весь день; раз в десять минут заглянуть в полкилобайта
		   дешевле, чем объяснять, почему расписание «зависло» на утреннем состоянии. */
		refetchInterval: 10 * 60 * 1000,
	});
}

export function useGroups (version: Ref<string | null> | ComputedRef<string | null>)
{
	return useQuery({
		queryKey: computed(() => queryKeys.groups(version.value)),
		queryFn: () => fetchGroups(version.value),
		staleTime: Infinity,
	});
}

/**
 * Расписание группы уже в нормализованном виде.
 *
 * `select` здесь не украшение: normalize() проходит по всему массиву и считает совпадения
 * по времени, а vue-query кэширует результат select и пересчитывает его только при смене
 * данных. Разбирай мы дамп в computed компонента — он пересчитывался бы на каждый ввод
 * символа в поиске.
 */
export function useScheduleQuery (
	groupId: Ref<string | null> | ComputedRef<string | null>,
	version: Ref<string | null> | ComputedRef<string | null>,
)
{
	return useQuery({
		queryKey: computed(() => queryKeys.schedule(groupId.value ?? '', version.value)),
		queryFn: () => fetchSchedule(groupId.value as string, version.value),
		enabled: computed(() => Boolean(groupId.value)),
		select: (raw): Lesson[] => normalize(raw),
	});
}

export function useChangesQuery (
	groupId: Ref<string | null> | ComputedRef<string | null>,
	version: Ref<string | null> | ComputedRef<string | null>,
)
{
	return useQuery({
		queryKey: computed(() => queryKeys.changes(groupId.value ?? '', version.value)),
		queryFn: () => fetchChanges(groupId.value as string, version.value),
		enabled: computed(() => Boolean(groupId.value)),
		/* Свежие сверху: журнал только дописывается, и читают его с конца. */
		select: (entries): ChangeEntry[] => [ ...entries ].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)),
	});
}

export type { Group, Lesson, ChangeEntry };
