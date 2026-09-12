<script setup lang="ts">
defineProps<{
	title: string;
	hint?: string;
}>();
</script>

<template>
	<div class="flex flex-col items-center gap-2 px-6 py-16 text-center">
		<p class="text-[15px] font-medium text-text">{{ title }}</p>
		<p v-if="hint" class="max-w-sm text-[13px] text-muted">{{ hint }}</p>
		<slot />
	</div>
</template>
