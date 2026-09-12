<script setup lang="ts">
import { RouterLink } from 'vue-router';

import EmptyState from '@/components/ui/EmptyState.vue';
</script>

<template>
	<EmptyState title="Такой страницы нет" hint="Возможно, ссылка устарела или в ней опечатка.">
		<RouterLink
			:to="{ name: 'schedule' }"
			class="mt-2 rounded-lg border border-line px-3 py-1.5 text-[13px] text-body transition-colors hover:bg-surface-soft"
		>
			К расписанию
		</RouterLink>
	</EmptyState>
</template>
