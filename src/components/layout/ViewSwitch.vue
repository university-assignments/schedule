<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';

defineProps<{ unseen: number }>();

const route = useRoute();

const TABS = [
	{ name: 'schedule', label: 'Расписание' },
	{ name: 'changes', label: 'Изменения' },
	{ name: 'teachers', label: 'Преподаватели' },
] as const;
</script>

<template>
	<nav class="flex shrink-0 gap-0.5 rounded-lg bg-line-soft p-0.5">
		<RouterLink
			v-for="tab in TABS"
			:key="tab.name"
			:to="{ name: tab.name, query: route.query }"
			class="relative rounded-md px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors"
			:class="route.name === tab.name ? 'bg-surface text-text shadow-[var(--shadow)]' : 'text-slate hover:text-body'"
		>
			{{ tab.label }}

			<!-- Бейдж только на «Изменениях» и только пока есть непрочитанное: постоянный
			     ноль рядом со вкладкой человек перестаёт замечать за день. -->
			<span
				v-if="tab.name === 'changes' && unseen > 0"
				class="ml-1 inline-flex min-w-4 justify-center rounded-full bg-accent px-1 text-[10px] leading-4 font-semibold text-white"
			>
				{{ unseen > 99 ? '99+' : unseen }}
			</span>
		</RouterLink>
	</nav>
</template>
