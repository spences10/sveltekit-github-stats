import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { get_github_stats_data } from './github-stats.js';

const env = vi.hoisted(() => ({ GITHUB_TOKEN: 'test-only-token' }));
vi.mock('$app/env/private', () => env);

const params = {
	username: 'alice',
	since: '2026-08-01',
	until: '2026-08-03',
};
const fetch_mock = vi.fn<typeof fetch>();

beforeEach(() => {
	env.GITHUB_TOKEN = 'test-only-token';
	vi.stubGlobal('fetch', fetch_mock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	fetch_mock.mockReset();
});

describe('GitHub stats runtime', () => {
	it('uses the private runtime token and preserves aggregation', async () => {
		fetch_mock.mockResolvedValue(
			Response.json({
				total_count: 2,
				items: ['2026-08-01T09:00:00Z', '2026-08-03T12:00:00Z'].map(
					(date) => ({
						repository: {
							full_name: 'alice/demo',
							html_url: 'https://github.com/alice/demo',
						},
						commit: { author: { date } },
					}),
				),
			}),
		);

		const result = await get_github_stats_data(params);
		expect(fetch_mock).toHaveBeenCalledExactlyOnceWith(
			'https://api.github.com/search/commits?q=author:alice+author-date:2026-08-01..2026-08-03&sort=author-date&order=desc&per_page=100&page=1',
			{
				headers: {
					Authorization: 'Bearer test-only-token',
					Accept: 'application/vnd.github.v3+json',
					'X-GitHub-Api-Version': '2022-11-28',
					'User-Agent': 'sveltekit-github-stats',
				},
			},
		);
		expect(result).toEqual({
			...params,
			total_commits: 2,
			repositories: [
				{
					name: 'alice/demo',
					url: 'https://github.com/alice/demo',
					commits: 2,
					last_updated: '2026-08-03T12:00:00Z',
				},
			],
			daily_commits: [
				{ date: '2026-08-01', count: 1 },
				{ date: '2026-08-03', count: 1 },
			],
			hourly_commits: Array.from({ length: 24 }, (_, hour) => ({
				hour,
				count: hour === 9 || hour === 12 ? 1 : 0,
			})),
			reached_limit: false,
			note: null,
		});
	});

	it('rejects invalid input without contacting GitHub', async () => {
		await expect(
			get_github_stats_data({ ...params, username: '' }),
		).rejects.toThrow();
		expect(fetch_mock).not.toHaveBeenCalled();
	});

	it('reports a missing runtime token without contacting GitHub', async () => {
		env.GITHUB_TOKEN = '';
		await expect(get_github_stats_data(params)).rejects.toThrow(
			'GITHUB_TOKEN is not configured.',
		);
		expect(fetch_mock).not.toHaveBeenCalled();
	});

	it('preserves upstream error handling', async () => {
		fetch_mock.mockResolvedValue(new Response(null, { status: 403 }));
		await expect(get_github_stats_data(params)).rejects.toThrow(
			'Failed to fetch data from GitHub: 403',
		);
		expect(fetch_mock).toHaveBeenCalledTimes(1);
	});
});

it('reports secondary rate limits and respects retry-after without retrying', async () => {
	fetch_mock.mockResolvedValue(
		Response.json(
			{ message: 'You have exceeded a secondary rate limit.' },
			{
				status: 403,
				headers: {
					'retry-after': '120',
					'x-ratelimit-remaining': '29',
				},
			},
		),
	);
	await expect(get_github_stats_data(params)).rejects.toThrow(
		'Wait at least 120 seconds',
	);
	expect(fetch_mock).toHaveBeenCalledTimes(1);
});
it('reports primary rate limits from headers even without a JSON body', async () => {
	fetch_mock.mockResolvedValue(
		new Response(null, {
			status: 403,
			headers: { 'x-ratelimit-remaining': '0' },
		}),
	);
	await expect(get_github_stats_data(params)).rejects.toThrow(
		'GitHub’s request limit was reached',
	);
});

const page_items = (count: number) =>
	Array.from({ length: count }, () => ({
		repository: {
			full_name: 'alice/demo',
			html_url: 'https://github.com/alice/demo',
		},
		commit: { author: { date: '2026-08-01T09:00:00Z' } },
	}));

it.each([100, 200, 1000])(
	'stops after fetching exactly %i commits',
	async (total) => {
		fetch_mock.mockImplementation(async () =>
			Response.json({
				total_count: total,
				incomplete_results: false,
				items: page_items(100),
			}),
		);
		const result = await get_github_stats_data(params);
		expect(fetch_mock).toHaveBeenCalledTimes(total / 100);
		expect(result.total_commits).toBe(total);
		expect(result.reached_limit).toBe(false);
	},
);
it('keeps the 1000-result cap for larger searches', async () => {
	fetch_mock.mockImplementation(async () =>
		Response.json({
			total_count: 1200,
			incomplete_results: false,
			items: page_items(100),
		}),
	);
	const result = await get_github_stats_data(params);
	expect(fetch_mock).toHaveBeenCalledTimes(10);
	expect(result.total_commits).toBe(1000);
	expect(result.reached_limit).toBe(true);
});
it('rejects 422 instead of returning a cacheable zero', async () => {
	fetch_mock.mockResolvedValue(
		Response.json({ message: 'Validation Failed' }, { status: 422 }),
	);
	await expect(get_github_stats_data(params)).rejects.toThrow(
		'could not process this search',
	);
	expect(fetch_mock).toHaveBeenCalledTimes(1);
});
it('rejects incomplete search pages, including after a successful page', async () => {
	fetch_mock.mockResolvedValueOnce(
		Response.json({
			total_count: 200,
			incomplete_results: false,
			items: page_items(100),
		}),
	);
	fetch_mock.mockResolvedValueOnce(
		Response.json({
			total_count: 200,
			incomplete_results: true,
			items: page_items(20),
		}),
	);
	await expect(get_github_stats_data(params)).rejects.toThrow(
		'incomplete search results',
	);
	expect(fetch_mock).toHaveBeenCalledTimes(2);
});
