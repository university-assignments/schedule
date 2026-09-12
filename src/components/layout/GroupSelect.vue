<script setup lang="ts">
import { computed } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue';

import type { Group } from '@/api/DTOs';

const props = defineProps<{
	groups: Group[];
	current: Group | null;
}>();

const emit = defineEmits<{ select: [ slug: string ] }>();

/* Одна группа — выбирать не из чего, и выпадающий список только занимает место в шапке
   на телефоне. Показываем название текстом. */
const single = computed(() => props.groups.length <= 1);
</script>

<template>
	<p v-if="single" class="truncate text-[14px] font-semibold text-text">
		{{ current?.name ?? '—' }}
	</p>

	<Listbox
		v-else
		:model-value="current?.slug ?? ''"
		@update:model-value="(slug) => emit('select', String(slug))"
	>
		<div class="relative">
			<ListboxButton
				class="flex max-w-[13rem] items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[14px] font-semibold text-text transition-colors hover:bg-surface-soft"
			>
				<span class="truncate">{{ current?.name ?? 'Выберите группу' }}</span>
				<svg class="size-3.5 shrink-0 text-muted" viewBox="0 0 14 14" fill="none" aria-hidden="true">
					<path d="m3.5 5.5 3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				</svg>
			</ListboxButton>

			<ListboxOptions
				class="absolute z-20 mt-1 max-h-72 w-56 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow)] focus:outline-none"
			>
				<ListboxOption
					v-for="group in groups"
					v-slot="{ active, selected }"
					:key="group.id"
					:value="group.slug"
					as="template"
				>
					<li
						class="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px]"
						:class="[ active ? 'bg-surface-soft' : '', selected ? 'text-accent-ink font-medium' : 'text-body' ]"
					>
						<span class="truncate">{{ group.name }}</span>
						<span v-if="group.mine" class="shrink-0 text-[11px] text-muted">моя</span>
					</li>
				</ListboxOption>
			</ListboxOptions>
		</div>
	</Listbox>
</template>
