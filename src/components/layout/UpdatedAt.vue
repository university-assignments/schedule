<script setup lang="ts">
import { computed } from 'vue';

import { dayjs, formatStamp } from '@/lib/date';

const props = defineProps<{ updatedAt: string | null }>();

/*
 * Отдельно подсвечиваем «давно не обновлялось»: молча показывать недельной давности
 * расписание как актуальное — худшее, что этот сайт может сделать. Прогон ходит раз в
 * несколько часов, поэтому сутки тишины означают, что что-то сломалось.
 */
const isStale = computed(() =>
{
	if (!props.updatedAt) return true;
	return dayjs().diff(dayjs(props.updatedAt), 'hour') >= 24;
});
</script>

<template>
	<p
		class="shrink-0 text-[12px] whitespace-nowrap"
		:class="isStale ? 'text-moved' : 'text-muted'"
		:title="updatedAt ? new Date(updatedAt).toLocaleString('ru-RU') : 'Данные ещё ни разу не выгружались'"
	>
		<span class="hidden sm:inline">Обновлено: </span>{{ formatStamp(updatedAt) }}
	</p>
</template>
