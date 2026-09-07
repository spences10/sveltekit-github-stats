import { expect, test, type Page } from '@playwright/test';
import type { github_stats_result } from '#lib/server/github-stats.js';

test.use({ timezoneId: 'UTC' });

async function open_stats(page: Page) {
	await page.addInitScript(() => {
		if (!localStorage.getItem('github_username')) {
			localStorage.setItem('github_username', 'hydration-ready');
		}
	});
	await page.goto('/?date=2026-08-01');
	// The saved handle is restored by onMount, so controls are hydrated.
	await expect(
		page.getByLabel('GitHub handle', { exact: true }),
	).toHaveValue('hydration-ready');
}

function stats(username: string, since: string, until: string) {
	return {
		username,
		since,
		until,
		total_commits: username === 'alice' ? 12 : 5,
		repositories: [
			{
				name: `${username}/demo`,
				url: `https://github.com/${username}/demo`,
				commits: username === 'alice' ? 12 : 5,
				last_updated: `${until}T12:00:00Z`,
			},
		],
		daily_commits: [{ date: since, count: 3 }],
		hourly_commits: Array.from({ length: 24 }, (_, hour) => ({
			hour,
			count: hour === 12 ? 3 : 0,
		})),
		reached_limit: false,
		note: null,
	} satisfies github_stats_result;
}

async function mock_stats(page: Page, failing_user?: string) {
	const requests: URLSearchParams[] = [];
	await page.route('**/api/github-stats?*', async (route) => {
		const params = new URL(route.request().url()).searchParams;
		requests.push(params);
		const username = params.get('username') ?? '';
		if (username === failing_user) {
			await route.fulfill({
				status: 400,
				contentType: 'text/plain',
				body: 'GitHub is temporarily unavailable',
			});
		} else {
			await route.fulfill({
				json: stats(
					username,
					params.get('since') ?? '',
					params.get('until') ?? '',
				),
			});
		}
	});
	return requests;
}

test('custom-date comparison renders results and remembers handles', async ({
	page,
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	const requests = await mock_stats(page);
	await open_stats(page);
	await page
		.getByLabel('GitHub handle', { exact: true })
		.fill('alice');
	await page.getByLabel('Compare with', { exact: true }).fill('bob');
	await page.getByText('Specific year or custom dates').click();
	await expect(page.getByLabel('Since', { exact: true })).toHaveValue(
		'2026-08-01',
	);
	await page.getByLabel('Until', { exact: true }).fill('2026-08-03');
	await page.getByRole('button', { name: 'Show stats' }).click();

	await expect(page.getByText('7 commits apart')).toBeVisible();
	await expect(
		page.getByText('@alice', { exact: true }).first(),
	).toBeVisible();
	await expect(
		page.getByText('@bob', { exact: true }).first(),
	).toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'Commits over time' }),
	).toBeVisible();
	// Both fixtures have identical daily values: comparison curves must
	// coincide, rather than adding the second handle to the first.
	const chart = page.locator('section').filter({
		has: page.getByRole('heading', { name: 'Commits over time' }),
	});
	const lines = chart.locator('path.lc-area-line');
	await expect(lines).toHaveCount(2);
	await expect
		.poll(async () => {
			const paths = await lines.evaluateAll((elements) =>
				elements.map((element) => element.getAttribute('d')),
			);
			return Boolean(paths[0]) && paths[0] === paths[1];
		})
		.toBe(true);

	expect(
		requests.map((params) => Object.fromEntries(params)),
	).toEqual([
		{ username: 'alice', since: '2026-08-01', until: '2026-08-03' },
		{ username: 'bob', since: '2026-08-01', until: '2026-08-03' },
	]);
	await page.reload();
	await expect(
		page.getByLabel('GitHub handle', { exact: true }),
	).toHaveValue('alice');
	await expect(
		page.getByLabel('Compare with', { exact: true }),
	).toHaveValue('bob');
	expect(errors).toEqual([]);
});

test('primary failure displays an error and allows another request', async ({
	page,
}) => {
	await mock_stats(page, 'unavailable');
	await open_stats(page);
	await page
		.getByLabel('GitHub handle', { exact: true })
		.fill('unavailable');
	await page.getByRole('button', { name: 'Show stats' }).click();
	await expect(
		page.getByText('Couldn’t fetch commits'),
	).toBeVisible();
	await expect(
		page.getByText('GitHub is temporarily unavailable'),
	).toBeVisible();
	await expect(
		page.getByRole('button', { name: 'Show stats' }),
	).toBeEnabled();

	await page
		.getByLabel('GitHub handle', { exact: true })
		.fill('alice');
	await page.getByRole('button', { name: 'Show stats' }).click();
	await expect(
		page.getByText('@alice', { exact: true }).first(),
	).toBeVisible();
	await expect(
		page.getByText('Couldn’t fetch commits'),
	).not.toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'Commits over time' }),
	).not.toBeVisible();
});

test('comparison failure retains primary results and quick dates still work', async ({
	page,
}) => {
	const requests = await mock_stats(page, 'unavailable');
	await open_stats(page);
	await page
		.getByLabel('GitHub handle', { exact: true })
		.fill('alice');
	await page
		.getByLabel('Compare with', { exact: true })
		.fill('unavailable');
	await page.getByRole('button', { name: 'Show stats' }).click();
	await expect(
		page.getByText('Couldn’t load the comparison'),
	).toBeVisible();
	await expect(
		page.getByText('@alice', { exact: true }).first(),
	).toBeVisible();

	await page.getByLabel('Compare with', { exact: true }).fill('');
	await page
		.getByRole('button', { name: 'This year', exact: true })
		.click();
	await expect(
		page.getByText('Couldn’t load the comparison'),
	).not.toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'Commits over time' }),
	).toBeVisible();
	const year = await page.evaluate(() => new Date().getUTCFullYear());
	expect(Object.fromEntries(requests.at(-1)!)).toEqual({
		username: 'alice',
		since: `${year}-01-01`,
		until: await page.evaluate(() =>
			new Date().toISOString().slice(0, 10),
		),
	});
});

test('rolling month shows a heatmap; daily and weekly ranges do not', async ({
	page,
}) => {
	const requests = await mock_stats(page);
	await open_stats(page);
	await page
		.getByLabel('GitHub handle', { exact: true })
		.fill('alice');
	await page
		.getByRole('button', { name: 'Last 30 days', exact: true })
		.click();
	await expect(
		page.getByRole('region', {
			name: 'Commit calendar',
			exact: true,
		}),
	).toBeVisible();
	await page.getByText('View daily counts', { exact: true }).click();
	await expect(page.getByRole('table')).toBeVisible();
	await expect(
		page.getByRole('table').locator('tbody tr'),
	).toHaveCount(30);
	const request = requests.at(-1)!;
	expect(
		(Date.parse(request.get('until')!) -
			Date.parse(request.get('since')!)) /
			86400000,
	).toBe(29);
	await page
		.getByRole('button', { name: 'Last 7 days', exact: true })
		.click();
	await expect(
		page.getByRole('heading', { name: 'Commits over time' }),
	).toBeVisible();
	await expect(
		page.getByRole('region', {
			name: 'Commit calendar',
			exact: true,
		}),
	).toHaveCount(0);
	await page
		.getByRole('button', { name: 'Today', exact: true })
		.click();
	await expect(
		page.getByRole('heading', { name: 'Commits over time' }),
	).toHaveCount(0);
	await expect(
		page.getByRole('region', {
			name: 'Commit calendar',
			exact: true,
		}),
	).toHaveCount(0);
});
