import { describe, expect, it, vi } from 'vitest';
import { actions } from './+page.server';

vi.mock('@sveltejs/kit', async () => {
	const actual = await vi.importActual('@sveltejs/kit');
	return {
		...actual,
		fail: (status: number, data: any) => ({ status, data }),
	};
});

describe('Page server actions', () => {
	it('should handle form submission successfully', async () => {
		const mock_fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				username: 'testuser',
				total_commits: 5,
				repositories: [
					{
						name: 'user/repo1',
						url: 'https://github.com/user/repo1',
						commits: 3,
					},
					{
						name: 'user/repo2',
						url: 'https://github.com/user/repo2',
						commits: 2,
					},
				],
			}),
		});

		const mock_request = {
			formData: vi.fn().mockResolvedValue({
				get: (key: string) =>
					key === 'username' ? 'testuser' : null,
			}),
		};

		const result = await actions.default({
			request: mock_request as any,
			fetch: mock_fetch,
		} as any);

		expect(result).toEqual({
			username: 'testuser',
			total_commits: 5,
			repositories: [
				{
					name: 'user/repo1',
					url: 'https://github.com/user/repo1',
					commits: 3,
				},
				{
					name: 'user/repo2',
					url: 'https://github.com/user/repo2',
					commits: 2,
				},
			],
		});
	});

	it('should handle missing username', async () => {
		const mock_request = {
			formData: vi.fn().mockResolvedValue({
				get: () => null,
			}),
		};

		const result = await actions.default({
			request: mock_request as any,
		} as any);

		expect(result).toEqual({
			status: 400,
			data: { error: 'Username is required' },
		});
	});

	it('should handle fetch errors', async () => {
		const mock_fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: vi.fn().mockResolvedValue({ error: 'API Error' }),
		});

		const mock_request = {
			formData: vi.fn().mockResolvedValue({
				get: (key: string) =>
					key === 'username' ? 'testuser' : null,
			}),
		};

		const result = await actions.default({
			request: mock_request as any,
			fetch: mock_fetch,
		} as any);

		expect(result).toEqual({
			status: 500,
			data: { error: 'API Error' },
		});
	});
});
