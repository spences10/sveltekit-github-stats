# GitHub Stats Lab

A SvelteKit dashboard for exploring public GitHub commit activity by user and date range.

## Stack

- SvelteKit 2 + Svelte 5
- LayerChart for visualizations
- shadcn-svelte components
- Tailwind CSS v4
- GitHub Search Commits API

## Developing

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
pnpm test:unit -- --run
pnpm test:e2e
pnpm build
```
