<script setup lang="ts">
const model = defineModel<string>({ required: true });

defineProps<{ placeholder?: string }>();
</script>

<template>
	<label class="relative flex min-w-0 flex-1 items-center">
		<svg class="pointer-events-none absolute left-3 size-4 text-muted" viewBox="0 0 20 20" fill="none" aria-hidden="true">
			<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" />
			<path d="m13.5 13.5 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
		</svg>

		<input
			v-model="model"
			type="search"
			:placeholder="placeholder ?? 'Поиск'"
			class="w-full rounded-lg border border-line bg-surface py-2 pr-8 pl-9 text-[13px] text-body placeholder:text-muted focus:border-accent-line focus:outline-none"
		>

		<button
			v-if="model"
			type="button"
			class="absolute right-2 rounded p-1 text-muted transition-colors hover:text-body"
			aria-label="Очистить"
			@click="model = ''"
		>
			<svg class="size-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
				<path d="m3 3 8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
			</svg>
		</button>
	</label>
</template>
