import { onScopeDispose, ref, watch, type Ref } from 'vue';

/**
 * Копия значения, отстающая от источника на `delay` мс.
 *
 * Нужна поиску: по нему пересобирается весь список пар, а печатают люди быстрее, чем раз
 * в четверть секунды. Само поле ввода при этом остаётся мгновенным — отложено только то
 * значение, которое читает фильтр.
 */
export function useDebounced<T> (source: Ref<T>, delay = 250): Ref<T>
{
	const debounced = ref(source.value) as Ref<T>;
	let timer: ReturnType<typeof setTimeout> | undefined;

	watch(source, (next) =>
	{
		clearTimeout(timer);
		timer = setTimeout(() =>
		{
			debounced.value = next;
		}, delay);
	});

	// Иначе таймер сработает уже после ухода со страницы и разбудит размонтированный ref.
	onScopeDispose(() => clearTimeout(timer));

	return debounced;
}
