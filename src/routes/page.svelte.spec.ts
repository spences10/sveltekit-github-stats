import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render h2', async () => {
		render(Page, {
			data: {
				initial_date_option: 'this_year',
				initial_date: '',
			},
		});

		const heading = page.getByRole('heading', { level: 2 });
		await expect.element(heading).toBeInTheDocument();
	});
});
