<script setup lang="ts">
import { RouterView } from 'vue-router';

import AppHeader from '@/components/layout/AppHeader.vue';
import { provideAppData } from '@/composables/useAppData';

/*
 * Запросы заводятся здесь и раздаются через provide: шапке нужны те же группы и та же
 * отметка времени, что и страницам, а useCurrentGroup, вызванный дважды, дублировал бы
 * запись группы в адресную строку.
 */
provideAppData();

const REPO = 'https://github.com/university-assignments/schedule';
</script>

<template>
	<div class="flex min-h-dvh flex-col">
		<AppHeader />

		<main class="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-5">
			<RouterView />
		</main>

		<footer class="mx-auto w-full max-w-6xl px-3 py-6 text-[12px] text-muted sm:px-5">
			<p>
				Данные выгружаются автоматически из
				<a class="underline-offset-2 hover:underline" href="https://online.susu.ru/schedule">online.susu.ru</a>
				и лежат в
				<a class="underline-offset-2 hover:underline" :href="REPO">репозитории</a>
				обычными JSON-файлами. Это неофициальная страница: при расхождении верным
				считайте расписание университета.
			</p>
		</footer>
	</div>
</template>
