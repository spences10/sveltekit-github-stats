import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import {
	create_stats_cache,
	type StatsCacheStorage,
} from './github-stats-cache.js';
import type {
	github_params,
	github_stats_result,
} from './github-stats.js';

vi.mock('$app/env/private', () => ({
	GITHUB_TOKEN: 'test-only-token',
}));
const params = {
	username: 'alice',
	since: '2026-09-07',
	until: '2026-09-07',
};
const options = {
	origin: 'https://stats.example',
	namespace: 'token-fingerprint',
};
const result: github_stats_result = {
	...params,
	total_commits: 6,
	repositories: [],
	daily_commits: [],
	hourly_commits: [],
	reached_limit: false,
	note: null,
};
const loader = () =>
	vi.fn(async (input: github_params) => ({ ...result, ...input }));

function edge_cache() {
	const entries = new Map<string, Response>();
	return {
		match: vi.fn(async (key: RequestInfo | URL) =>
			entries
				.get(key instanceof Request ? key.url : key.toString())
				?.clone(),
		),
		put: vi.fn(async (key: RequestInfo | URL, value: Response) => {
			entries.set(
				key instanceof Request ? key.url : key.toString(),
				value.clone(),
			);
		}),
	} satisfies StatsCacheStorage;
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime('2026-09-07T12:00:00Z');
});
afterEach(() => vi.useRealTimers());

describe('GitHub stats caching', () => {
	it('reuses current results for 60 seconds without changing the fetch timestamp', async () => {
		const load = loader();
		const get = create_stats_cache(load);
		const first = await get(params, options);
		vi.setSystemTime('2026-09-07T12:00:59Z');
		expect(
			await get({ ...params, username: ' ALICE ' }, options),
		).toEqual(first);
		expect(load).toHaveBeenCalledTimes(1);
		vi.setSystemTime('2026-09-07T12:01:00Z');
		expect((await get(params, options)).fetched_at).toBe(
			'2026-09-07T12:01:00.000Z',
		);
		expect(load).toHaveBeenCalledTimes(2);
	});
	it('retains completed ranges for one hour', async () => {
		const load = loader();
		const get = create_stats_cache(load);
		const past = {
			...params,
			since: '2026-08-01',
			until: '2026-08-31',
		};
		await get(past, options);
		vi.setSystemTime('2026-09-07T12:59:59Z');
		await get(past, options);
		expect(load).toHaveBeenCalledTimes(1);
		vi.setSystemTime('2026-09-07T13:00:00Z');
		await get(past, options);
		expect(load).toHaveBeenCalledTimes(2);
	});
	it('keeps ranges extending into the future on the short TTL', async () => {
		const load = loader();
		const get = create_stats_cache(load);
		const future = { ...params, until: '2026-12-31' };
		await get(future, options);
		vi.setSystemTime('2026-09-07T12:01:00Z');
		await get(future, options);
		expect(load).toHaveBeenCalledTimes(2);
	});
	it('shares simultaneous identical requests', async () => {
		const deferred = Promise.withResolvers<github_stats_result>();
		const load = vi.fn(() => deferred.promise);
		const get = create_stats_cache(load);
		const first = get(params, options);
		const second = get(params, options);
		deferred.resolve(result);
		expect(await first).toEqual(await second);
		expect(load).toHaveBeenCalledTimes(1);
	});
	it('does not cache failures and clears rejected in-flight work', async () => {
		const load = loader();
		load.mockRejectedValueOnce(new Error('rate limited'));
		const get = create_stats_cache(load);
		const storage = edge_cache();
		await expect(
			get(params, { ...options, storage }),
		).rejects.toThrow('rate limited');
		expect(storage.put).not.toHaveBeenCalled();
		expect(
			(await get(params, { ...options, storage })).total_commits,
		).toBe(6);
		expect(load).toHaveBeenCalledTimes(2);
	});
	it('reuses edge results in a new instance and enforces their original expiry', async () => {
		const storage = edge_cache();
		const load = loader();
		const first = await create_stats_cache(load)(params, {
			...options,
			storage,
		});
		expect(storage.put).toHaveBeenCalledTimes(1);
		expect(
			storage.put.mock.calls[0][1].headers.get('Cache-Control'),
		).toBe('public, max-age=60');
		vi.setSystemTime('2026-09-07T12:00:45Z');
		const get = create_stats_cache(load);
		expect(await get(params, { ...options, storage })).toEqual(first);
		expect(load).toHaveBeenCalledTimes(1);
		vi.setSystemTime('2026-09-07T12:01:00Z');
		await get(params, { ...options, storage });
		expect(load).toHaveBeenCalledTimes(2);
	});
	it('separates handles, dates, origins, and credential namespaces', async () => {
		const load = loader();
		const get = create_stats_cache(load);
		await get(params, options);
		await get({ ...params, username: 'bob' }, options);
		await get({ ...params, since: '2026-09-01' }, options);
		await get(params, { ...options, namespace: 'rotated-token' });
		await get(params, {
			...options,
			origin: 'https://preview.example',
		});
		expect(load).toHaveBeenCalledTimes(5);
	});
	it('continues when edge reads and writes fail', async () => {
		const storage = {
			match: vi
				.fn()
				.mockRejectedValue(new Error('cache unavailable')),
			put: vi.fn().mockRejectedValue(new Error('cache unavailable')),
		};
		const load = loader();
		const get = create_stats_cache(load);
		expect(
			(await get(params, { ...options, storage })).total_commits,
		).toBe(6);
		expect(
			(await get(params, { ...options, storage })).total_commits,
		).toBe(6);
		expect(load).toHaveBeenCalledTimes(1);
	});
	it('rejects invalid ranges before contacting storage or GitHub', async () => {
		const load = loader();
		const get = create_stats_cache(load);
		const storage = edge_cache();
		await expect(
			get(
				{ ...params, since: '2026-09-08' },
				{ ...options, storage },
			),
		).rejects.toThrow('start date');
		await expect(
			get({ ...params, username: ' ' }, { ...options, storage }),
		).rejects.toThrow();
		expect(storage.match).not.toHaveBeenCalled();
		expect(load).not.toHaveBeenCalled();
	});
	it('bounds the in-memory cache', async () => {
		const load = loader();
		const get = create_stats_cache(load);
		for (let i = 0; i < 51; i++)
			await get({ ...params, username: `user-${i}` }, options);
		await get({ ...params, username: 'user-50' }, options);
		expect(load).toHaveBeenCalledTimes(51);
		await get({ ...params, username: 'user-0' }, options);
		expect(load).toHaveBeenCalledTimes(52);
	});
});
