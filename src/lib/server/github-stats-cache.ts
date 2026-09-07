import * as v from 'valibot';
import {
	github_params_schema,
	github_stats_schema,
	type github_params,
	type github_stats_result,
} from './github-stats.js';

export type github_stats_response = github_stats_result & {
	fetched_at: string;
};
const cache_entry_schema = v.object({
	result: v.object({
		...github_stats_schema.entries,
		fetched_at: v.pipe(v.string(), v.isoTimestamp()),
	}),
	expires_at: v.pipe(v.number(), v.finite()),
});
type CacheEntry = v.InferOutput<typeof cache_entry_schema>;
export type StatsCacheStorage = Pick<Cache, 'match' | 'put'>;
type CacheOptions = {
	origin: string;
	namespace: string;
	storage?: StatsCacheStorage;
};

/** Cloudflare storage is shared within a data centre; in-flight work is shared
 * only within this Worker instance. Memory also supports local development. */
export function create_stats_cache(
	load: (params: github_params) => Promise<github_stats_result>,
) {
	const memory = new Map<string, CacheEntry>();
	const pending = new Map<string, Promise<github_stats_response>>();
	const max_entries = 50;

	function remember(key: string, entry: CacheEntry) {
		for (const [existing_key, existing] of memory) {
			if (existing.expires_at <= Date.now())
				memory.delete(existing_key);
		}
		memory.delete(key);
		memory.set(key, entry);
		if (memory.size > max_entries)
			memory.delete(memory.keys().next().value!);
	}

	return async (
		input: github_params,
		options: CacheOptions,
	): Promise<github_stats_response> => {
		const parsed = v.parse(github_params_schema, input);
		const params = {
			...parsed,
			username: parsed.username.toLowerCase(),
		};
		if (params.since > params.until)
			throw new Error(
				'The start date must be on or before the end date.',
			);
		const key_url = new URL(
			`/__github-stats-cache/v2/${options.namespace}`,
			options.origin,
		);
		key_url.search = new URLSearchParams(params).toString();
		const key = key_url.toString();
		const cached = memory.get(key);
		if (cached && cached.expires_at > Date.now())
			return cached.result;
		memory.delete(key);
		const existing = pending.get(key);
		if (existing) return existing;

		const request = async () => {
			// Cache faults must not prevent a successful GitHub request.
			try {
				const response = await options.storage?.match(key);
				if (response?.ok) {
					const entry = v.parse(
						cache_entry_schema,
						await response.json(),
					);
					if (
						entry.expires_at > Date.now() &&
						entry.result.username === params.username &&
						entry.result.since === params.since &&
						entry.result.until === params.until
					) {
						remember(key, entry);
						return entry.result;
					}
				}
			} catch {
				/* Treat unavailable/corrupt cache entries as misses. */
			}

			const stats = await load(params);
			const now = Date.now();
			const fetched_at = new Date(now).toISOString();
			const ttl = params.until < fetched_at.slice(0, 10) ? 3600 : 60;
			const entry: CacheEntry = {
				result: { ...stats, fetched_at },
				expires_at: now + ttl * 1000,
			};
			remember(key, entry);
			try {
				// Await the write so it finishes before the Worker request ends.
				await options.storage?.put(
					key,
					Response.json(entry, {
						headers: { 'Cache-Control': `public, max-age=${ttl}` },
					}),
				);
			} catch {
				/* The memory copy and live response remain usable. */
			}
			return entry.result;
		};
		const promise = request();
		pending.set(key, promise);
		try {
			return await promise;
		} finally {
			pending.delete(key);
		}
	};
}
