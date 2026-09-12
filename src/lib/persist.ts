/*
 * Тонкая обёртка над localStorage.
 *
 * Читать его напрямую нельзя по двум причинам: в приватном окне и при запрещённых
 * сайту данных сам доступ к свойству бросает исключение (не возвращает null), а
 * лежащий там JSON мог быть записан прошлой версией страницы и уже не разбираться.
 * И то, и другое должно кончаться значением по умолчанию, а не белым экраном.
 */

export function readJson<T> (key: string, fallback: T): T
{
	try
	{
		const raw = window.localStorage.getItem(key);
		if (raw === null) return fallback;
		return JSON.parse(raw) as T;
	}
	catch
	{
		return fallback;
	}
}

export function writeJson (key: string, value: unknown): void
{
	try
	{
		window.localStorage.setItem(key, JSON.stringify(value));
	}
	catch
	{
		// Квота или запрет на хранение: настройка не сохранится, но страница работает.
	}
}
