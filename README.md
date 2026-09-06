# GitHub Stats Lab

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

Use Node 24 (see `.node-version`) and pnpm 11.22.0.

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
