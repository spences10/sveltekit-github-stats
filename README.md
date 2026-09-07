# SvelteKit GitHub stats

A SvelteKit dashboard for exploring public GitHub commit activity by
user and date range.

## Stack

- SvelteKit 3 prerelease + Svelte 5
- Vite 8 + Vite+ (Oxfmt/Oxlint, including Svelte formatting)
- TypeScript 6 tooling + TypeScript 7 native checking
- Cloudflare Workers
- LayerChart for visualizations
- shadcn-svelte components
- Tailwind CSS v4
- GitHub Search Commits API

## Developing

Use Node 24 (see `.node-version`) and the pnpm version in
`package.json`.

Create a `.env` file with a GitHub token:

```sh
GITHUB_TOKEN=github_pat_...
```

Install dependencies and start the dev server:

```sh
pnpm install
pnpm dev
```

## Checks

```sh
pnpm check
pnpm lint
pnpm test:unit --run
pnpm test:e2e
pnpm build
pnpm format
```

Kit configuration lives in `vite.config.ts`; library imports use
`#lib` with explicit file extensions. `src/env.ts` declares
`GITHUB_TOKEN` as a private runtime variable.

Vitest and its Playwright provider are pinned to the version bundled
with Vite+. Formatting uses Vite+ only; no Prettier setup is needed.
Tests use mocked GitHub data and do not require a token.

To smoke-test the Cloudflare build locally (without deploying):

```sh
pnpm build
pnpm exec wrangler dev --local
```

## Stats caching

Successful results are cached by normalized GitHub handle and exact
UTC start/end dates. Ranges ending today or later have a 60-second
lifetime; completed periods have a one-hour lifetime. The original
fetch time is returned as `fetched_at` and displayed beside each
handle in the overview. Expiry is fixed when GitHub returns the
result; cache hits do not extend it.

On Cloudflare Workers, results use the Cache API (no additional
bindings). Each data centre has its own cache. A bounded, 50-entry
memory cache also works locally and reuses results within a Worker
instance. Identical in-flight requests share a promise within that
instance; this is not a global request lock across Workers or data
centres.

Failures are not cached, and a cache read/write failure falls back to
the live result. Cache keys are versioned and scoped to the request
origin and a SHA-256 fingerprint of the server token, so a token
rotation cannot reuse old entries. The token itself is never stored in
a cache key or response. HTTP responses use `Cache-Control: no-store`;
only the explicit server cache stores results, keeping the expiry
policy in one place.

To review: fetch a range twice before its expiry and check that its
“Updated” timestamp stays the same. After expiry, the next request
fetches GitHub again and advances the timestamp. Merely keeping the
page open does not trigger refreshes. Different or overlapping ranges
still need their own first fetch; GitHub's search limits and
1,000-result cap still apply.
