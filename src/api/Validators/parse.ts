import type { ZodType } from 'zod';

/**
 * Разбор ответа по схеме с человеческим текстом ошибки.
 *
 * Сырое сообщение zod («Invalid input: expected string, received undefined») ничего не
 * говорит о том, ЧТО именно сломалось: файлов четыре, и все они массивы похожей формы.
 * Поэтому к тексту добавляется имя файла и путь до поля — этого хватает, чтобы понять,
 * дамп ли поехал или схему пора обновлять.
 */
export function parseFile<T> (schema: ZodType<T>, data: unknown, source: string): T
{
	const result = schema.safeParse(data);
	if (result.success) return result.data;

	const first = result.error.issues[0];
	const path = first?.path.join('.') || '(корень)';
	throw new Error(`Файл ${source} не соответствует схеме: ${path} — ${first?.message ?? 'неизвестная ошибка'}`);
}
