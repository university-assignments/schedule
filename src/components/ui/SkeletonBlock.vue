<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 6 });
</script>

<template>
	<div class="flex flex-col gap-2 p-4" aria-hidden="true">
		<div
			v-for="row in rows"
			:key="row"
			class="h-9 animate-pulse rounded-lg bg-line-soft"
			:style="{ animationDelay: `${row * 60}ms` }"
		/>
	</div>
</template>
