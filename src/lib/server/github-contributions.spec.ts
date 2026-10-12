import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { get_github_contributions_data } from './github-contributions.js';

const env = vi.hoisted(() => ({ GITHUB_TOKEN: 'test-only-token' }));
vi.mock('$app/env/private', () => env);

const params = {
	username: 'alice',
	since: '2026-08-01',
	until: '2026-08-03',
};
const fetch_mock = vi.fn<typeof fetch>();

beforeEach(() => {
	vi.stubGlobal('fetch', fetch_mock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	fetch_mock.mockReset();
});

describe('GitHub contributions runtime', () => {
	it('flattens the calendar weeks into daily counts', async () => {
		fetch_mock.mockResolvedValue(
			Response.json({
				data: {
					user: {
						contributionsCollection: {
							contributionYears: [2026, 2025],
							contributionCalendar: {
								totalContributions: 7,
								weeks: [
									{
										contributionDays: [
											{ date: '2026-08-01', contributionCount: 3 },
										],
									},
									{
										contributionDays: [
											{ date: '2026-08-02', contributionCount: 0 },
											{ date: '2026-08-03', contributionCount: 4 },
										],
									},
								],
							},
						},
					},
				},
			}),
		);

		await expect(
			get_github_contributions_data(params),
		).resolves.toEqual({
			...params,
			total_contributions: 7,
			years: [2026, 2025],
			daily_contributions: [
				{ date: '2026-08-01', count: 3 },
				{ date: '2026-08-02', count: 0 },
				{ date: '2026-08-03', count: 4 },
			],
		});
		const [url, init] = fetch_mock.mock.calls[0];
		expect(url).toBe('https://api.github.com/graphql');
		expect(new Headers(init?.headers).get('Authorization')).toBe(
			'Bearer test-only-token',
		);
		expect(JSON.parse(init?.body as string).variables).toEqual({
			login: 'alice',
			from: '2026-08-01T00:00:00Z',
			to: '2026-08-03T23:59:59Z',
		});
	});

	it('reports an unknown handle', async () => {
		fetch_mock.mockResolvedValue(
			Response.json({
				data: { user: null },
				errors: [{ message: 'Could not resolve to a User' }],
			}),
		);
		await expect(
			get_github_contributions_data(params),
		).rejects.toThrow(
			'GitHub could not load contributions: Could not resolve to a User',
		);
	});

	it('refuses ranges GitHub cannot serve in one request', async () => {
		await expect(
			get_github_contributions_data({
				...params,
				since: '2024-01-01',
			}),
		).rejects.toThrow('at most one year');
		expect(fetch_mock).not.toHaveBeenCalled();
	});
});
