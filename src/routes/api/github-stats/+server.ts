import { get_cache_options } from '#lib/server/cache-options.js';
import { get_github_stats_data } from '#lib/server/github-stats.js';
import { create_stats_cache } from '#lib/server/github-stats-cache.js';
import { error, type RequestHandler } from '@sveltejs/kit';

const cached_stats = create_stats_cache(get_github_stats_data);

export const GET: RequestHandler = async ({ url }) => {
	try {
		return Response.json(
			await cached_stats(
				{
					username: url.searchParams.get('username') ?? '',
					since: url.searchParams.get('since') ?? '',
					until: url.searchParams.get('until') ?? '',
				},
				await get_cache_options(url),
			),
			{
				// Cache only in the explicit server store. Browser/CDN caching could
				// otherwise extend the TTL or conceal a token/configuration change.
				headers: { 'Cache-Control': 'no-store' },
			},
		);
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: 'An error occurred while fetching data';
		error(400, message);
	}
};
