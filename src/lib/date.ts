import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/ru';

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);
dayjs.locale('ru');

export { dayjs };

/*
 * Всё расписание живёт в одном часовом поясе — челябинском, и сравнивается по календарной
 * дате, а не по моменту времени. Поэтому даты здесь строки 'YYYY-MM-DD' и остаются ими:
 * стоит превратить их в Date, как браузер в другом поясе сдвинет полночь и «сегодня»
 * начнёт указывать на соседний день.
 */

const WEEKDAYS = [ 'воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота' ];
const WEEKDAYS_SHORT = [ 'вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб' ];

export function today (): string
{
	return dayjs().format('YYYY-MM-DD');
}

export function weekdayOf (date: string): number
{
	return dayjs(date).isoWeekday();
}

export function weekdayName (date: string): string
{
	return WEEKDAYS[dayjs(date).day()] ?? '';
}

export function weekdayShort (date: string): string
{
	return WEEKDAYS_SHORT[dayjs(date).day()] ?? '';
}

/** «1 сентября» — без года: год виден из выбранного периода и в таблице только мешает. */
export function formatDay (date: string): string
{
	return dayjs(date).format('D MMMM');
}

/** «Пн, 1 сент.» — для заголовка группы строк. */
export function formatDayHeading (date: string): string
{
	return `${capitalize(weekdayShort(date))}, ${dayjs(date).format('D MMM')}`;
}

/** Момент прогона: «12 сент., 09:15». Год не пишем по той же причине. */
export function formatStamp (iso: string | null): string
{
	if (!iso) return 'ещё не обновлялось';
	return dayjs(iso).format('D MMM, HH:mm');
}

/** '08:00:00' → '08:00'. Секунды в расписании всегда нулевые и только занимают место. */
export function shortTime (time: string): string
{
	return time.slice(0, 5);
}

export function isoWeekKey (date: string): string
{
	const d = dayjs(date);
	return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`;
}

/** Понедельник недели, в которую попадает дата. */
export function startOfWeek (date: string): string
{
	return dayjs(date).startOf('isoWeek').
		format('YYYY-MM-DD');
}

export function addWeeks (date: string, count: number): string
{
	return dayjs(date).add(count, 'week').
		format('YYYY-MM-DD');
}

export function addMonths (date: string, count: number): string
{
	return dayjs(date).add(count, 'month').
		format('YYYY-MM-DD');
}

export function addDays (date: string, count: number): string
{
	return dayjs(date).add(count, 'day').
		format('YYYY-MM-DD');
}

/**
 * Подпись диапазона для переключателя недель: «7–13 сент.», «28 сент. – 4 окт.».
 *
 * Месяц у левой границы печатается, только когда он отличается от правой: в «7 сент. –
 * 13 сент.» второе «сент.» ничего не добавляет, а строка перестаёт помещаться в кнопку
 * на телефоне.
 */
export function formatRange (from: string, to: string): string
{
	const start = dayjs(from);
	const end = dayjs(to);

	if (start.isSame(end, 'month')) return `${start.format('D')}–${end.format('D MMM')}`;
	return `${start.format('D MMM')} – ${end.format('D MMM')}`;
}

/** «Сентябрь» — подпись месяца для того же переключателя. */
export function formatMonth (date: string): string
{
	return capitalize(dayjs(date).format('MMMM'));
}

export function endOfWeek (date: string): string
{
	return dayjs(date).endOf('isoWeek').
		format('YYYY-MM-DD');
}

export function startOfMonth (date: string): string
{
	return dayjs(date).startOf('month').
		format('YYYY-MM-DD');
}

export function endOfMonth (date: string): string
{
	return dayjs(date).endOf('month').
		format('YYYY-MM-DD');
}

/** Разница в минутах между двумя 'HH:mm:ss' одного дня. */
export function minutesBetween (begin: string, end: string): number
{
	return toMinutes(end) - toMinutes(begin);
}

export function toMinutes (time: string): number
{
	const [ hours = '0', minutes = '0' ] = time.split(':');
	return Number(hours) * 60 + Number(minutes);
}

function capitalize (value: string): string
{
	return value.charAt(0).toUpperCase() + value.slice(1);
}
