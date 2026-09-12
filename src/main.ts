import '@/styles/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';

import App from '@/App.vue';
import router from '@/router';
import { queryClient } from '@/queries/client';

async function bootstrap (): Promise<void>
{
	const app = createApp(App);

	app.use(createPinia());
	app.use(router);
	app.use(VueQueryPlugin, { queryClient });

	/*
	 * Ждём первую навигацию ДО монтирования, иначе присланная ссылка теряет фильтры.
	 *
	 * Пока роутер не готов, useRoute() отдаёт START_LOCATION — маршрут с пустым query.
	 * App.vue в своём setup заводит запросы и следит за выбранной группой, а тот
	 * наблюдатель дописывает ?group=… в адрес. Страницы приезжают отдельными чанками, и
	 * на первом (некэшированном) заходе groups.json успевал прийти раньше чанка: замена
	 * адреса уходила, когда query был ещё пуст, и ?period=all&teacher=… из ссылки
	 * затирался.
	 *
	 * Ловилось это ровно один раз на человека: при втором открытии всё уже в кэше, и
	 * порядок менялся на безопасный — то есть ошибка доставалась именно тому, кому
	 * ссылку прислали впервые.
	 */
	await router.isReady();

	app.mount('#app');
}

void bootstrap();
