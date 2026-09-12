/*
 * Единственный источник ключей кэша.
 *
 * Версия входит в ключ дампа не для красоты: именно она и делает обновление заметным.
 * Изменился updatedAt в meta.json — ключ другой, vue-query идёт за файлом, а адрес
 * запроса тоже другой (?v=…), то есть мимо кэша Pages. Один и тот же признак работает
 * сразу на двух уровнях, и рассинхронизироваться они не могут.
 */
export const queryKeys = {
	meta: [ 'meta' ] as const,
	groups: (version: string | null) => [ 'groups', version ] as const,
	schedule: (groupId: string, version: string | null) => [ 'schedule', groupId, version ] as const,
	changes: (groupId: string, version: string | null) => [ 'changes', groupId, version ] as const,
};
