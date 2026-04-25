<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { ThemeToggle } from '$lib/components';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>GitHub Stats Lab</title>
	<meta
		name="description"
		content="Explore public GitHub commit activity by repository, date range, and UTC hour."
	/>
</svelte:head>

<div class="isolate min-h-dvh">
	<header
		class="sticky top-0 z-20 border-b bg-background/75 backdrop-blur-xl"
	>
		<div
			class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
		>
			<a
				href={resolve('/')}
				class="flex items-center gap-3 font-semibold tracking-tight"
			>
				<span
					class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
				>
					⌁
				</span>
				<span>GitHub Stats Lab</span>
			</a>
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="hidden sm:inline-flex"
					>Live GitHub data</Badge
				>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:py-10">
		{@render children?.()}
	</main>

	<footer class="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
		<Separator class="mb-6" />
		<p class="text-sm text-muted-foreground">
			Made by
			<a
				class="font-medium text-foreground underline-offset-4 hover:underline"
				href="https://scottspence.com"
			>
				Scott Spence
			</a>
			· Commit data from the GitHub API.
		</p>
	</footer>
</div>
