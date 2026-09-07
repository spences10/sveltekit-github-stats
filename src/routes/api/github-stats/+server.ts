import { get_github_stats_data } from '#lib/server/github-stats.js';
import { create_stats_cache } from '#lib/server/github-stats-cache.js';
import { GITHUB_TOKEN } from '$app/env/private';
import { error, type RequestHandler } from '@sveltejs/kit';

const cached_stats = create_stats_cache(get_github_stats_data);

export const GET: RequestHandler = async ({ url }) => {
	try {
		if (!GITHUB_TOKEN)
			throw new Error('GITHUB_TOKEN is not configured.');
		// Isolate cached data across token rotations without storing the secret
		// in a cache URL, log, or response.
		const digest = await crypto.subtle.digest(
			'SHA-256',
			new TextEncoder().encode(GITHUB_TOKEN),
		);
		const namespace = Array.from(new Uint8Array(digest), (byte) =>
			byte.toString(16).padStart(2, '0'),
		).join('');
		const storage =
			typeof caches === 'undefined'
				? undefined
				: (caches as CacheStorage & { default?: Cache }).default;
		return Response.json(
			await cached_stats(
				{
					username: url.searchParams.get('username') ?? '',
					since: url.searchParams.get('since') ?? '',
					until: url.searchParams.get('until') ?? '',
				},
				{ origin: url.origin, namespace, storage },
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
