import { createRouter, createWebHashHistory } from 'vue-router';

/*
 * Хэш-история, а не history API, и это вынужденно.
 *
 * GitHub Pages — обычный файловый хостинг: он не умеет отдавать index.html на
 * произвольный путь. Открой человек /schedule/changes по присланной ссылке — Pages
 * ответил бы своей 404-страницей, потому что такого файла в репозитории нет. Обходной
 * приём с копией index.html под именем 404.html работает, но ценой настоящей 404 в
 * логах и мигания страницы при переходе.
 *
 * С решёткой (#/changes) сервер видит только /schedule/ и отдаёт его всегда.
 */
const router = createRouter({
	history: createWebHashHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', redirect: { name: 'schedule' } },
		{
			path: '/schedule',
			name: 'schedule',
			component: () => import('@/pages/SchedulePage.vue'),
		},
		{
			path: '/changes',
			name: 'changes',
			component: () => import('@/pages/ChangesPage.vue'),
		},
		{
			path: '/teachers',
			name: 'teachers',
			component: () => import('@/pages/TeachersPage.vue'),
		},
		{
			path: '/:pathMatch(.*)*',
			name: 'not-found',
			component: () => import('@/pages/NotFoundPage.vue'),
		},
	],
	scrollBehavior: (to, from) =>
	{
		/* Смена вкладки — это новая страница, её показываем сверху. Смена фильтра меняет
		   только query, и прокручивать список под руками человека не надо. */
		if (to.name === from.name) return false;
		return { top: 0 };
	},
});

export default router;
