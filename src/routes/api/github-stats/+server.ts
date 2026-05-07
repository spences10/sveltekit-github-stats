import { get_github_stats_data } from '$lib/server/github-stats';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	try {
		return json(
			await get_github_stats_data({
				username: url.searchParams.get('username') ?? '',
				since: url.searchParams.get('since') ?? '',
				until: url.searchParams.get('until') ?? '',
			}),
		);
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: 'An error occurred while fetching data';
		error(400, message);
	}
};
