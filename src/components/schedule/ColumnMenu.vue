<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';

import { ALL_COLUMNS, COLUMN_LABELS, usePreferencesStore } from '@/stores/preferences';

const preferences = usePreferencesStore();
</script>

<template>
	<Popover class="relative">
		<PopoverButton
			class="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-[13px] text-body transition-colors hover:bg-surface-soft"
			title="Колонки"
		>
			<svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4" />
				<path d="M6.5 3v10M10 3v10" stroke="currentColor" stroke-width="1.4" />
			</svg>
			<span class="hidden sm:inline">Колонки</span>
		</PopoverButton>

		<PopoverPanel class="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow)]">
			<label
				v-for="column in ALL_COLUMNS"
				:key="column"
				class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-surface-soft"
			>
				<input
					type="checkbox"
					class="size-3.5 shrink-0 accent-[var(--accent)]"
					:checked="!preferences.hiddenColumns.includes(column)"
					@change="preferences.toggleColumn(column)"
				>
				<span class="text-[13px] text-body">{{ COLUMN_LABELS[column] }}</span>
			</label>

			<button
				type="button"
				class="mt-1 w-full rounded-lg border-t border-line px-2.5 py-1.5 text-left text-[12px] text-slate transition-colors hover:bg-surface-soft"
				@click="preferences.resetColumns()"
			>
				Вернуть по умолчанию
			</button>
		</PopoverPanel>
	</Popover>
</template>
