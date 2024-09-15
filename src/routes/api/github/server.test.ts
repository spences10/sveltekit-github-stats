import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

vi.mock('$env/static/private', () => ({
	GITHUB_TOKEN: 'mock_token',
}));

describe('GitHub API endpoint', () => {
	let mock_fetch: any;

	beforeEach(() => {
		mock_fetch = vi.fn();
		vi.stubGlobal('fetch', mock_fetch);
	});

	it('should return an error if username is not provided', async () => {
		const url = new URL('http://localhost/api/github');
		const result = await GET({ url, fetch: mock_fetch } as any);
		expect(result.status).toBe(400);
		expect(await result.json()).toEqual({
			error: 'Username is required',
		});
	});

	it('should fetch and return GitHub data successfully', async () => {
		const mock_response = {
			ok: true,
			json: vi.fn().mockResolvedValue({
				total_count: 5,
				items: [
					{
						repository: {
							full_name: 'user/repo1',
							html_url: 'https://github.com/user/repo1',
						},
					},
					{
						repository: {
							full_name: 'user/repo1',
							html_url: 'https://github.com/user/repo1',
						},
					},
					{
						repository: {
							full_name: 'user/repo2',
							html_url: 'https://github.com/user/repo2',
						},
					},
				],
			}),
		};
		mock_fetch.mockResolvedValue(mock_response);

		const url = new URL(
			'http://localhost/api/github?username=testuser',
		);
		const result = await GET({ url, fetch: mock_fetch } as any);

		expect(result.status).toBe(200);
		const data = await result.json();
		expect(data).toEqual({
			username: 'testuser',
			total_commits: 5,
			since: expect.any(String),
			until: expect.any(String),
			repositories: [
				{
					name: 'user/repo1',
					url: 'https://github.com/user/repo1',
					commits: 2,
				},
				{
					name: 'user/repo2',
					url: 'https://github.com/user/repo2',
					commits: 1,
				},
			],
		});
	});

	it('should handle GitHub API errors', async () => {
		const mock_response = {
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
			text: vi.fn().mockResolvedValue('API Error'),
		};
		mock_fetch.mockResolvedValue(mock_response);

		const url = new URL(
			'http://localhost/api/github?username=testuser',
		);
		const result = await GET({ url, fetch: mock_fetch } as any);

		expect(result.status).toBe(500);
		expect(await result.json()).toEqual({
			error: 'Failed to fetch data from GitHub',
		});
	});
});
