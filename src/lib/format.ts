/**
 * Русское склонение при числительном: plural(3, [ 'пара', 'пары', 'пар' ]).
 *
 * Нужно чаще, чем кажется: «5 изменения» в заголовке прогона и «1 пар» в счётчике
 * отфильтрованного — первое, за что цепляется глаз, и выглядит это как поломка данных,
 * а не как небрежность в подписи.
 */
export function plural (count: number, forms: [ string, string, string ]): string
{
	const mod10 = count % 10;
	const mod100 = count % 100;

	if (mod10 === 1 && mod100 !== 11) return forms[0];
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
	return forms[2];
}

export function countOf (count: number, forms: [ string, string, string ]): string
{
	return `${count} ${plural(count, forms)}`;
}

export const CHANGES_FORMS: [ string, string, string ] = [ 'изменение', 'изменения', 'изменений' ];
export const LESSONS_FORMS: [ string, string, string ] = [ 'пара', 'пары', 'пар' ];
export const TEACHERS_FORMS: [ string, string, string ] = [ 'преподаватель', 'преподавателя', 'преподавателей' ];
