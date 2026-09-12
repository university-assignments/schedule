import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginOxlint from 'eslint-plugin-oxlint';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfigWithVueTs(
	{
		name: 'app/files-to-lint',
		files: [ '**/*.{vue,ts,mts,tsx}' ],
	},

	globalIgnores([ '**/dist/**', '**/coverage/**' ]),

	...pluginVue.configs['flat/essential'],
	vueTsConfigs.recommended,

	...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

	/*
	 * Единый стиль кода (@stylistic): табы (4), allman-скобки, одинарные кавычки.
	 * Автоприменяется через `pnpm lint` (--fix) перед пушем.
	 */
	{
		name: 'stylistic-rules',
		plugins: { '@stylistic': stylistic },
		extends: [ stylistic.configs.all ],
		rules: {
			'@stylistic/array-bracket-spacing': [ 'error', 'always', { objectsInArrays: false, arraysInArrays: false }],
			'@stylistic/array-element-newline': [ 'error', 'consistent' ],
			'@stylistic/brace-style': [ 'error', 'allman' ],
			'@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
			'@stylistic/function-call-argument-newline': [ 'error', 'consistent' ],
			'@stylistic/indent': [ 'error', 'tab' ],
			'@stylistic/indent-binary-ops': [ 'error', 'tab' ],
			'@stylistic/object-curly-spacing': [ 'error', 'always', { emptyObjects: 'never' }],
			'@stylistic/object-property-newline': [ 'error', { allowAllPropertiesOnSameLine: true }],
			'@stylistic/operator-linebreak': [ 'error', 'before' ],
			'@stylistic/padded-blocks': [ 'error', 'never' ],
			'@stylistic/quote-props': [ 'error', 'as-needed' ],
			'@stylistic/quotes': [ 'error', 'single' ],
			// Приглушено из configs.all: конфликтуют между собой и не автофиксятся.
			'@stylistic/multiline-ternary': 'off',
			'@stylistic/no-extra-parens': 'off',
			'@stylistic/multiline-comment-style': 'off',
			'@stylistic/lines-around-comment': 'off',
		},
	},
);
