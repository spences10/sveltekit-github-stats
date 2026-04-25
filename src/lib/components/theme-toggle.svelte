<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Moon, Sun } from '$lib/icons';
	import { onMount } from 'svelte';

	let current_theme: 'light' | 'dark' = $state('light');

	const apply_theme = (theme: 'light' | 'dark') => {
		current_theme = theme;
		if (!browser) return;

		document.documentElement.classList.toggle(
			'dark',
			theme === 'dark',
		);
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	};

	const toggle_theme = () => {
		apply_theme(current_theme === 'light' ? 'dark' : 'light');
	};

	onMount(() => {
		const stored_theme = localStorage.getItem('theme') as
			| 'light'
			| 'dark'
			| null;
		const preferred_theme = window.matchMedia(
			'(prefers-color-scheme: dark)',
		).matches
			? 'dark'
			: 'light';

		apply_theme(stored_theme ?? preferred_theme);
	});
</script>

<Button
	variant="outline"
	size="icon"
	onclick={toggle_theme}
	title="Toggle theme"
	aria-label="Toggle between light and dark theme"
	class="rounded-full bg-card/80 backdrop-blur"
>
	{#if current_theme === 'light'}
		<Moon class_names="h-4 w-4" />
	{:else}
		<Sun class_names="h-4 w-4" />
	{/if}
</Button>
