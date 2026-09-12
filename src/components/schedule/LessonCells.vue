<script setup lang="ts">
import KindBadge from '@/components/ui/KindBadge.vue';
import { formatDay, weekdayShort } from '@/lib/date';
import type { Lesson } from '@/lib/lesson';
import { ALIGN_END } from '@/lib/table';
import type { ColumnId } from '@/stores/preferences';

defineProps<{
	lesson: Lesson;
	columns: ColumnId[];
	/** Пара изменилась в последнюю выгрузку — строка подсвечена целиком. */
	changed?: boolean;
}>();

/*
 * Ячейки вынесены отдельным компонентом, а не расписаны внутри таблицы, потому что
 * рисуются в двух местах: сгруппированным по дням списком и плоским — после сортировки
 * по колонке. Две разметки разошлись бы на первой же правке.
 *
 * Компонент отдаёт несколько корневых <td> — во Vue 3 это обычный фрагмент, и в <tr>
 * они попадают как родные: шаблоны компилируются, разбором HTML браузером они не проходят.
 */
</script>

<template>
	<td
		v-for="column in columns"
		:key="column"
		class="px-3 py-2 align-top text-[13px]"
		:class="ALIGN_END.includes(column) ? 'text-right tnum' : 'text-left'"
	>
		<template v-if="column === 'date'">
			<span class="whitespace-nowrap text-slate">
				{{ weekdayShort(lesson.date) }}, {{ formatDay(lesson.date) }}
			</span>
		</template>

		<template v-else-if="column === 'slot'">
			<span class="text-muted">{{ lesson.isAllDay ? '—' : lesson.slot ?? '—' }}</span>
		</template>

		<template v-else-if="column === 'time'">
			<span class="tnum whitespace-nowrap text-body">{{ lesson.begin }}–{{ lesson.end }}</span>
		</template>

		<template v-else-if="column === 'subject'">
			<span class="font-medium" :class="changed ? 'text-moved' : 'text-text'">{{ lesson.subject }}</span>

			<!-- Признака подгруппы в данных университета нет; отметка «в это же время есть
			     ещё пара» — единственное, что про них вообще известно. -->
			<span
				v-if="lesson.hasConflict"
				class="ml-1.5 align-middle text-[11px] text-muted"
				title="В это же время у группы стоит ещё одна пара — вероятно, деление на подгруппы"
			>
				⇄
			</span>
		</template>

		<template v-else-if="column === 'kind'">
			<KindBadge :kind="lesson.kind" :title="lesson.kindLabel" />
		</template>

		<template v-else-if="column === 'teachers'">
			<span class="text-body">{{ lesson.teachers.join(', ') || '—' }}</span>
		</template>

		<template v-else-if="column === 'rooms'">
			<span class="whitespace-nowrap text-slate">{{ lesson.rooms.join(', ') || '—' }}</span>
		</template>
	</td>
</template>
