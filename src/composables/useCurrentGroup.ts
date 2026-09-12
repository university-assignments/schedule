import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { usePreferencesStore } from '@/stores/preferences';
import type { Group } from '@/api/DTOs';

/*
 * Какая группа сейчас открыта.
 *
 * Приоритет — адрес, потом localStorage, потом группа с флагом mine, потом первая из
 * списка. Именно в таком порядке: присланная ссылка должна открыть ту группу, что в
 * ней написана, даже если человек до этого смотрел свою. А открытая «просто так»
 * страница — наоборот, свою, а не первую попавшуюся по алфавиту.
 *
 * Выбор из адреса запоминается: переключил группу — она же откроется завтра.
 */
export function useCurrentGroup (groups: () => Group[] | undefined)
{
	const route = useRoute();
	const router = useRouter();
	const preferences = usePreferencesStore();

	const current = computed<Group | null>(() =>
	{
		const list = groups();
		if (!list?.length) return null;

		const fromQuery = typeof route.query.group === 'string' ? route.query.group : '';
		return list.find((group) => group.slug === fromQuery)
			?? list.find((group) => group.slug === preferences.groupSlug)
			?? list.find((group) => group.mine)
			?? list[0]
			?? null;
	});

	watch(current, (group) =>
	{
		if (!group) return;
		preferences.groupSlug = group.slug;

		/*
		 * Догружаем slug в адрес, если его там не было. Без этого ссылка, скопированная
		 * из строки браузера, вела бы на «группу по умолчанию получателя», а не на ту,
		 * что человек видел перед собой.
		 */
		if (route.query.group !== group.slug)
		{
			void router.replace({ query: { ...route.query, group: group.slug } });
		}
	}, { immediate: true });

	function select (slug: string): void
	{
		void router.replace({ query: { ...route.query, group: slug } });
	}

	return { current, select };
}
