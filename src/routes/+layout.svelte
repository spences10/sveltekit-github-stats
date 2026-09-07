<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { ThemeToggle } from '#lib/components/index.js';
	import { resolve } from '$app/paths';
	import '@fontsource-variable/inter';
	import { ArrowUpRight } from '@lucide/svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SvelteKit GitHub stats</title>
	<meta
		name="description"
		content="Quickly check how many public GitHub commits you’ve made today. Enter your handle to see your count, or choose another date range."
	/>
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<a
		href="#main"
		class="sr-only z-50 bg-card p-3 focus:not-sr-only focus:absolute"
	>
		Skip to content
	</a>
	<header>
		<div
			class="mx-auto flex max-w-7xl items-center justify-between gap-4 border-b px-5 py-5 sm:px-8 lg:px-10"
		>
			<a
				href={resolve('/')}
				class="flex min-w-0 items-center gap-3"
				aria-label="SvelteKit GitHub stats home"
			>
				<img src={favicon} alt="" class="size-9 shrink-0" />
				<span
					class="text-sm font-semibold tracking-tight sm:text-base"
				>
					SvelteKit <span class="font-normal">
						GitHub stats
					</span></span
				>
			</a>
			<div class="flex items-center gap-5">
				<span
					class="font-mono text-xs text-muted-foreground max-sm:hidden"
				>
					Public commit counts
				</span>
				<ThemeToggle />
			</div>
		</div>
	</header>
	<main
		id="main"
		class="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-10"
	>
		{@render children?.()}
	</main>
	<footer
		class="mx-auto flex w-full max-w-7xl flex-col gap-3 border-t px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"
	>
		<p>
			Made with SvelteKit by <a
				class="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
				href="https://scottspence.com"
			>
				Scott Spence
				<ArrowUpRight class="size-4 shrink-0" aria-hidden="true" />
			</a>
		</p>
		<span class="font-mono text-xs">
			Powered by public GitHub data
		</span>
	</footer>
</div>
