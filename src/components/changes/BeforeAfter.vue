<script setup lang="ts">
import { computed } from 'vue';

import { formatDay, weekdayShort } from '@/lib/date';
import type { ChangeSide } from '@/api/DTOs';

const props = defineProps<{
	before: ChangeSide | null;
	after: ChangeSide | null;
}>();

/*
 * Подсвечиваем ровно те поля, которые разошлись.
 *
 * Без этого «было → стало» превращается в две одинаковые на вид строки, в которых
 * человеку предлагается самому найти отличие — а отличается там, как правило, одно
 * поле из пяти (чаще всего аудитория).
 */
type Field = 'when' | 'subject' | 'type' | 'teachers' | 'rooms';

const FIELDS: Array<{ id: Field; label: string }> = [
	{ id: 'when', label: 'Когда' },
	{ id: 'subject', label: 'Предмет' },
	{ id: 'type', label: 'Тип' },
	{ id: 'teachers', label: 'Преподаватель' },
	{ id: 'rooms', label: 'Аудитория' },
];

function valueOf (side: ChangeSide | null, field: Field): string
{
	if (!side) return '';

	switch (field)
	{
		case 'when':
			return `${weekdayShort(side.date)}, ${formatDay(side.date)} · ${side.begin}–${side.end}`;
		case 'subject':
			return side.subject;
		case 'type':
			return side.type;
		case 'teachers':
			return side.teachers.join(', ');
		case 'rooms':
			return side.rooms.join(', ');
	}
}

/* Поля, одинаковые с обеих сторон, не показываем вовсе: они не менялись, и их
   единственная роль в списке — разбавлять то, что действительно изменилось. */
const rows = computed(() => FIELDS.
	map((field) => ({
		id: field.id,
		label: field.label,
		before: valueOf(props.before, field.id),
		after: valueOf(props.after, field.id),
	})).
	filter((row) => row.before !== row.after));
</script>

<template>
	<div class="overflow-hidden rounded-lg border border-line">
		<div
			v-for="row in rows"
			:key="row.id"
			class="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-0.5 border-b border-line-soft px-3 py-2 last:border-0 sm:grid-cols-[7rem_1fr_1fr]"
		>
			<span class="text-[11px] tracking-wide text-muted uppercase">{{ row.label }}</span>

			<span class="text-[13px] text-removed line-through">{{ row.before || '—' }}</span>

			<span class="col-start-2 text-[13px] font-medium text-added sm:col-start-3">
				{{ row.after || '—' }}
			</span>
		</div>
	</div>
</template>
