import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const username = data.get('username');
		const today = new Date().toISOString().split('T')[0];
		const since = data.get('since') || today;
		const until = data.get('until') || today;

		if (!username) {
			return fail(400, { error: 'Username is required' });
		}

		try {
			const response = await fetch(`/api/github?username=${username}&since=${since}&until=${until}`);
			if (!response.ok) {
				const errorData = await response.json();
				return fail(response.status, { error: errorData.error });
			}
			const contributionsData = await response.json();
			return contributionsData;
		} catch (error) {
			return fail(500, { error: 'Failed to fetch contributions' });
		}
	}
};