import { GITHUB_TOKEN } from '$app/env/private';

/** Where a request's GitHub results are cached, and under which token */
export async function get_cache_options(url: URL) {
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
	return { origin: url.origin, namespace, storage };
}
