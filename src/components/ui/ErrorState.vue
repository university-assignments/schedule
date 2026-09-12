<script setup lang="ts">
const props = defineProps<{ error: unknown }>();

defineEmits<{ retry: [] }>();

/* Текст ошибки показываем целиком: почти всегда это сообщение от схемы с именем поля,
   и человеку, который держит репозиторий, оно говорит ровно то, что нужно. */
const message = props.error instanceof Error ? props.error.message : String(props.error ?? 'Неизвестная ошибка');
</script>

<template>
	<div class="flex flex-col items-center gap-3 px-6 py-16 text-center">
		<p class="text-[15px] font-medium text-text">Не удалось загрузить данные</p>
		<p class="max-w-lg text-[13px] break-words text-muted">{{ message }}</p>
		<button
			type="button"
			class="rounded-lg border border-line px-3 py-1.5 text-[13px] text-body transition-colors hover:bg-surface-soft"
			@click="$emit('retry')"
		>
			Повторить
		</button>
	</div>
</template>
