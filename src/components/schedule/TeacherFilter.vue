<script setup lang="ts">
import { computed, ref } from 'vue';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';

const model = defineModel<string[]>({ required: true });

const props = defineProps<{ teachers: string[] }>();

/* Преподавателей в потоке два десятка, и искать нужного глазами в выпадающем списке
   дольше, чем набрать три буквы фамилии. */
const needle = ref('');

const filtered = computed(() =>
{
	const query = needle.value.trim().toLowerCase();
	if (!query) return props.teachers;
	return props.teachers.filter((name) => name.toLowerCase().includes(query));
});

function toggle (name: string): void
{
	model.value = model.value.includes(name)
		? model.value.filter((item) => item !== name)
		: [ ...model.value, name ];
}

const label = computed(() =>
{
	if (!model.value.length) return 'Преподаватель';
	if (model.value.length === 1) return shortName(model.value[0] as string);
	return `Преподаватели: ${model.value.length}`;
});

/* «Соколов А. Н.» вместо полного ФИО: в кнопке фильтра три слова не помещаются,
   а фамилии с инициалами достаточно, чтобы понять, кто выбран. */
function shortName (name: string): string
{
	const [ last, first, middle ] = name.split(' ');
	if (!first) return name;
	return `${last} ${first.charAt(0)}.${middle ? ` ${middle.charAt(0)}.` : ''}`;
}
</script>

<template>
	<Popover class="relative">
		<PopoverButton
			class="flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[13px] transition-colors"
			:class="model.length ? 'border-accent-line bg-accent-wash text-accent-ink' : 'border-line bg-surface text-body hover:bg-surface-soft'"
		>
			<span class="max-w-[11rem] truncate">{{ label }}</span>
			<svg class="size-3.5 shrink-0 opacity-60" viewBox="0 0 14 14" fill="none" aria-hidden="true">
				<path d="m3.5 5.5 3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
			</svg>
		</PopoverButton>

		<PopoverPanel
			class="absolute z-20 mt-1 flex w-72 flex-col rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow)]"
		>
			<input
				v-model="needle"
				type="search"
				placeholder="Фамилия"
				class="m-1 rounded-lg border border-line bg-surface-soft px-2.5 py-1.5 text-[13px] text-body placeholder:text-muted focus:border-accent-line focus:outline-none"
			>

			<div class="max-h-64 overflow-auto">
				<label
					v-for="name in filtered"
					:key="name"
					class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-surface-soft"
				>
					<input
						type="checkbox"
						class="size-3.5 shrink-0 accent-[var(--accent)]"
						:checked="model.includes(name)"
						@change="toggle(name)"
					>
					<span class="truncate text-[13px] text-body">{{ name }}</span>
				</label>

				<p v-if="!filtered.length" class="px-3 py-4 text-center text-[12px] text-muted">
					Никого не нашлось
				</p>
			</div>

			<button
				v-if="model.length"
				type="button"
				class="m-1 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-slate transition-colors hover:bg-surface-soft"
				@click="model = []"
			>
				Сбросить выбор
			</button>
		</PopoverPanel>
	</Popover>
</template>
