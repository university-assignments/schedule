<script setup lang="ts">
import { ref } from 'vue';

import GroupSelect from '@/components/layout/GroupSelect.vue';
import ViewSwitch from '@/components/layout/ViewSwitch.vue';
import UpdatedAt from '@/components/layout/UpdatedAt.vue';
import MyLessonsModal from '@/components/layout/MyLessonsModal.vue';
import { useAppData } from '@/composables/useAppData';

const { groups, group, selectGroup, updatedAt, unseenChanges } = useAppData();

const settingsOpen = ref(false);
</script>

<template>
	<header class="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-5">
			<GroupSelect :groups="groups" :current="group" @select="selectGroup" />

			<!-- Переключатель вкладок на телефоне уезжает на вторую строку целиком:
			     ужимать его до иконок значило бы подписывать «Изменения» пиктограммой,
			     которую всё равно никто не узнает. -->
			<div class="order-3 w-full sm:order-none sm:w-auto">
				<ViewSwitch :unseen="unseenChanges" />
			</div>

			<div class="ml-auto flex items-center gap-2">
				<UpdatedAt :updated-at="updatedAt" />

				<button
					type="button"
					class="rounded-lg border border-line p-1.5 text-slate transition-colors hover:bg-surface-soft hover:text-body"
					aria-label="Мои пары"
					title="Мои пары"
					@click="settingsOpen = true"
				>
					<svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
						<circle cx="10" cy="10" r="2.6" stroke="currentColor" stroke-width="1.5" />
						<path
							d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7l-1.3 1.3M6 14l-1.3 1.3M15.3 15.3 14 14M6 6 4.7 4.7"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>
		</div>
	</header>

	<MyLessonsModal v-model:open="settingsOpen" />
</template>
