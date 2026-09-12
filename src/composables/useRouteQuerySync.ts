import { ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { emptyFilters, type FilterState, type Period } from '@/lib/filters';
import type { LessonKind } from '@/lib/lesson';

/*
 * Фильтры живут в адресной строке, а не только в памяти компонента.
 *
 * Смысл ровно один: ссылкой можно поделиться. «Вот что у нас на этой неделе у Соколова» —
 * это /#/schedule?group=my&teacher=Соколов…&period=week, и адресат видит то же самое, а
 * не пустую таблицу, которую ему ещё предстоит настроить.
 *
 * Побочно решается и кнопка «назад»: закрыв фильтр, человек возвращается к прошлому виду,
 * а не улетает со страницы.
 */

const PERIODS: Period[] = [ 'week', 'next', 'month', 'all' ];
const KINDS: LessonKind[] = [ 'lecture', 'practice', 'lab', 'exam', 'other' ];

export function useFilterQuerySync (): Ref<FilterState>
{
	const route = useRoute();
	const router = useRouter();

	const filters = ref<FilterState>(fromQuery(route.query));

	/*
	 * Две стороны синхронизации гасят друг друга сравнением сериализованного вида.
	 * Без этого запись в адрес вызывала бы чтение из адреса, то снова запись, и Vue
	 * рано или поздно упёрся бы в предел рекурсивных обновлений.
	 */
	watch(() => route.query, (query) =>
	{
		const next = fromQuery(query);
		if (serialize(next) !== serialize(filters.value)) filters.value = next;
	});

	watch(filters, (state) =>
	{
		if (serialize(fromQuery(route.query)) === serialize(state)) return;

		/*
		 * replace, а не push: набор символов в поиске иначе оставил бы в истории по записи
		 * на каждую букву, и «назад» пришлось бы жать двенадцать раз.
		 *
		 * group в запросе не трогаем — он принадлежит странице, а не фильтрам.
		 */
		void router.replace({ query: { ...toQuery(state), group: route.query.group } });
	}, { deep: true });

	return filters;
}

type Query = Record<string, unknown>;

function fromQuery (query: Query): FilterState
{
	const state = emptyFilters();

	state.search = single(query.q) ?? '';
	state.teachers = many(query.teacher);
	state.kinds = many(query.kind).filter((value): value is LessonKind => KINDS.includes(value as LessonKind));
	state.onlyMine = single(query.mine) === '1';

	const period = single(query.period);
	if (period && PERIODS.includes(period as Period)) state.period = period as Period;

	return state;
}

/* В адрес попадает только то, что отличается от значения по умолчанию: иначе даже
   нетронутая страница висела бы с хвостом ?q=&period=week&mine=0. */
function toQuery (state: FilterState): Query
{
	const query: Query = {};

	if (state.search.trim()) query.q = state.search.trim();
	if (state.teachers.length) query.teacher = state.teachers;
	if (state.kinds.length) query.kind = state.kinds;
	if (state.period !== 'week') query.period = state.period;
	if (state.onlyMine) query.mine = '1';

	return query;
}

function serialize (state: FilterState): string
{
	return JSON.stringify([
		state.search.trim(),
		[ ...state.teachers ].sort(),
		[ ...state.kinds ].sort(),
		state.period,
		state.onlyMine,
	]);
}

function single (value: unknown): string | undefined
{
	if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
	return typeof value === 'string' ? value : undefined;
}

function many (value: unknown): string[]
{
	if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
	return typeof value === 'string' && value ? [ value ] : [];
}
