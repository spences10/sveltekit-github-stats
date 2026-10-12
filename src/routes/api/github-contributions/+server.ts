import { get_cache_options } from '#lib/server/cache-options.js';
import {
	get_github_contributions_data,
	github_contributions_schema,
} from '#lib/server/github-contributions.js';
import { create_range_cache } from '#lib/server/github-stats-cache.js';
import { error, type RequestHandler } from '@sveltejs/kit';

const cached_contributions = create_range_cache(
	get_github_contributions_data,
	{
		schema: github_contributions_schema,
		path: '__github-contributions-cache/v1',
		// A finished range rarely changes; one that includes today does
		ttl: (range_ended) => (range_ended ? 86400 : 300),
	},
);

export const GET: RequestHandler = async ({ url }) => {
	try {
		return Response.json(
			await cached_contributions(
				{
					username: url.searchParams.get('username') ?? '',
					since: url.searchParams.get('since') ?? '',
					until: url.searchParams.get('until') ?? '',
				},
				await get_cache_options(url),
			),
			// Cache only in the explicit server store, as for commit stats.
			{ headers: { 'Cache-Control': 'no-store' } },
		);
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: 'An error occurred while fetching data';
		error(400, message);
	}
};
