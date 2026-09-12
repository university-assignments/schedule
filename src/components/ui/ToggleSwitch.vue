<script setup lang="ts">
import { Switch } from '@headlessui/vue';

const model = defineModel<boolean>({ required: true });

defineProps<{ label: string }>();
</script>

<template>
	<label class="flex cursor-pointer items-center gap-2 select-none">
		<Switch
			v-model="model"
			class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-line transition-colors"
			:class="model ? 'bg-accent' : 'bg-line-soft'"
		>
			<span
				class="inline-block size-3.5 rounded-full bg-surface shadow transition-transform"
				:class="model ? 'translate-x-4.5' : 'translate-x-1'"
			/>
		</Switch>
		<span class="text-[13px]" :class="model ? 'text-body' : 'text-slate'">{{ label }}</span>
	</label>
</template>
