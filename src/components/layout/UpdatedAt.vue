<script setup lang="ts">
import { formatStamp } from '@/lib/date';

defineProps<{ updatedAt: string | null }>();
</script>

<template>
	<p
		class="shrink-0 text-[12px] whitespace-nowrap text-muted"
		:title="updatedAt ? new Date(updatedAt).toLocaleString('ru-RU') : 'Данные ещё ни разу не выгружались'"
	>
		<span class="hidden sm:inline">Обновлено: </span>{{ formatStamp(updatedAt) }}
	</p>
</template>
