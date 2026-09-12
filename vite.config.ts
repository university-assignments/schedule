import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';

/*
 * Приложение живёт на GitHub Pages по адресу вида https://<user>.github.io/schedule/,
 * поэтому все ссылки на ассеты должны быть относительны подкаталогу, а не корню домена.
 * Локально (pnpm dev) подкаталога нет, но base работает и там — открывается
 * http://localhost:8030/schedule/, что заодно повторяет боевой путь один в один.
 *
 * Переопределяется переменной BASE_PATH — на случай, если репозиторий переименуют
 * или страницу повесят на собственный домен, где base снова станет '/'.
 */
const base = process.env.BASE_PATH ?? '/schedule/';

// https://vite.dev/config/
export default defineConfig({
	base,

	plugins: [ vue(), vueDevTools(), tailwindcss() ],

	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},

	server: {
		host: true,
	},
});
