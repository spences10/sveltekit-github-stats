<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { ThemeToggle } from '$lib/components';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SvelteKit GitHub Stats</title>
	<meta
		name="description"
		content="Explore and compare public GitHub commit activity with SvelteKit."
	/>
</svelte:head>

<div class="min-h-dvh">
	<header class="border-b bg-card">
		<div
			class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
		>
			<a
				href={resolve('/')}
				class="flex items-center gap-2.5 text-sm font-semibold"
				aria-label="SvelteKit GitHub Stats home"
			>
				<span
					class="grid size-7 place-items-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground"
					aria-hidden="true"
				>
					S
				</span>
				<span class="hidden sm:inline">SvelteKit GitHub Stats</span>
			</a>
			<ThemeToggle />
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
		{@render children?.()}
	</main>

	<footer
		class="mx-auto flex max-w-7xl flex-col gap-2 border-t px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
	>
		<a
			class="w-fit text-foreground underline-offset-4 hover:underline"
			href="https://scottspence.com"
		>
			Scott Spence
		</a>
		<span>Public commit data from GitHub</span>
	</footer>
</div>
