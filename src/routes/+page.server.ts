import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const date_option = data.get('date_option') as string;
		let since: string, until: string;

		if (date_option === 'today') {
			const today = new Date().toISOString().split('T')[0];
			since = today;
			until = today;
		} else if (date_option === 'year') {
			const year = data.get('year') as string;
			since = `${year}-01-01`;
			until = `${year}-12-31`;
		} else {
			since = data.get('since') as string;
			until = data.get('until') as string;
		}

		if (!username) {
			return fail(400, { error: 'Username is required' });
		}

		try {
			const response = await fetch(
				`/api/github?username=${username}&since=${since}&until=${until}`,
			);
			if (!response.ok) {
				const error_data = await response.json();
				return fail(response.status, {
					error: error_data.error,
					username,
				});
			}
			const contributions_data = await response.json();
			return { ...contributions_data, username };
		} catch (error) {
			return fail(500, {
				error: 'Failed to fetch contributions',
				username,
			});
		}
	},
};
