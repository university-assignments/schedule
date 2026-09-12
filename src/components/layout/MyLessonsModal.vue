<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';

import { usePreferencesStore } from '@/stores/preferences';
import { useAppData } from '@/composables/useAppData';

const open = defineModel<boolean>('open', { required: true });

const preferences = usePreferencesStore();
const { group, subjects, lessons } = useAppData();

/*
 * Правки копятся в черновике и уезжают в хранилище только по «Сохранить».
 *
 * Иначе каждое снятие галочки мгновенно перерисовывало бы таблицу под открытым окном —
 * а список предметов длинный, и человек снимает их пачкой.
 */
const draft = ref<string[]>([]);

watch(open, (isOpen) =>
{
	if (isOpen) draft.value = [ ...preferences.subjectsOfGroup(group.value?.id ?? '') ];
});

/*
 * Признака подгруппы в данных университета нет вовсе — есть только две пары в одно время.
 * Поэтому «мои пары» здесь честно ручные, а вот подсказка, ГДЕ искать расхождение,
 * машинная: предметы, у которых хоть раз нашёлся двойник по времени, показаны первыми.
 */
const conflicting = computed(() => new Set(lessons.value.filter((lesson) => lesson.hasConflict).map((lesson) => lesson.subject)));

const sorted = computed(() => [ ...subjects.value ].sort((a, b) =>
{
	const byConflict = Number(conflicting.value.has(b)) - Number(conflicting.value.has(a));
	return byConflict || a.localeCompare(b, 'ru');
}));

function toggle (subject: string): void
{
	draft.value = draft.value.includes(subject)
		? draft.value.filter((item) => item !== subject)
		: [ ...draft.value, subject ];
}

function save (): void
{
	preferences.setSubjects(group.value?.id ?? '', draft.value);
	open.value = false;
}
</script>

<template>
	<Dialog :open="open" class="relative z-50" @close="open = false">
		<div class="fixed inset-0 bg-black/40" aria-hidden="true" />

		<div class="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
			<DialogPanel
				class="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-line bg-surface sm:rounded-2xl"
			>
				<div class="border-b border-line px-5 py-4">
					<DialogTitle class="text-[15px] font-semibold text-text">Мои пары</DialogTitle>
					<p class="mt-1 text-[12px] text-muted">
						Отметьте предметы, которые ведутся у вас. Тумблер «Только мои» будет
						оставлять в таблице их одни. Предметы, у которых в расписании есть
						двойник в то же время (вероятно, подгруппы), показаны сверху.
					</p>
				</div>

				<div class="min-h-0 flex-1 overflow-auto p-2">
					<label
						v-for="subject in sorted"
						:key="subject"
						class="flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 hover:bg-surface-soft"
					>
						<input
							type="checkbox"
							class="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
							:checked="draft.includes(subject)"
							@change="toggle(subject)"
						>
						<span class="min-w-0 flex-1 text-[13px] text-body">
							{{ subject }}
							<span v-if="conflicting.has(subject)" class="ml-1 text-[11px] text-moved">подгруппы</span>
						</span>
					</label>

					<p v-if="!sorted.length" class="px-3 py-8 text-center text-[13px] text-muted">
						Расписание ещё не загружено.
					</p>
				</div>

				<div class="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
					<button
						type="button"
						class="text-[13px] text-slate transition-colors hover:text-body"
						@click="draft = []"
					>
						Снять все
					</button>

					<div class="flex gap-2">
						<button
							type="button"
							class="rounded-lg border border-line px-3 py-1.5 text-[13px] text-body transition-colors hover:bg-surface-soft"
							@click="open = false"
						>
							Отмена
						</button>
						<button
							type="button"
							class="rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
							@click="save"
						>
							Сохранить
						</button>
					</div>
				</div>
			</DialogPanel>
		</div>
	</Dialog>
</template>
