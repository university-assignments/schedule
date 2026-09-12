import { http, noCache, versioned } from '@/api/http';
import { parseFile } from '@/api/Validators/parse';
import {
	changesFileSchema,
	groupsFileSchema,
	metaFileSchema,
	rawScheduleSchema,
	type ChangeEntry,
	type Group,
	type MetaFile,
	type RawLesson,
} from '@/api/DTOs';

export async function fetchMeta (): Promise<MetaFile>
{
	const { data } = await http.get('meta.json', { params: noCache() });
	return parseFile(metaFileSchema, data, 'meta.json');
}

export async function fetchGroups (version: string | null): Promise<Group[]>
{
	const { data } = await http.get('groups.json', { params: versioned(version) });
	return parseFile(groupsFileSchema, data, 'groups.json').groups;
}

export async function fetchSchedule (groupId: string, version: string | null): Promise<RawLesson[]>
{
	const { data } = await http.get(`schedule/${groupId}.json`, { params: versioned(version) });
	return parseFile(rawScheduleSchema, data, `schedule/${groupId}.json`);
}

/*
 * Журнал правок может не существовать: группу добавили в конфиг, а прогон был всего один,
 * и сравнивать было не с чем. Это нормальное состояние, а не ошибка — 404 здесь означает
 * «правок пока нет», и показывать из-за него красный экран нельзя.
 */
export async function fetchChanges (groupId: string, version: string | null): Promise<ChangeEntry[]>
{
	try
	{
		const { data } = await http.get(`changes/${groupId}.json`, { params: versioned(version) });
		return parseFile(changesFileSchema, data, `changes/${groupId}.json`).entries;
	}
	catch (error)
	{
		if (axiosStatus(error) === 404) return [];
		throw error;
	}
}

function axiosStatus (error: unknown): number | undefined
{
	if (typeof error === 'object' && error !== null && 'response' in error)
	{
		const response = (error as { response?: { status?: number } }).response;
		return response?.status;
	}
	return undefined;
}
