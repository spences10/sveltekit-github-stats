<script lang="ts">
	import { browser } from '$app/environment';
	import { Moon, Sun } from '$lib/icons';
	import { onMount } from 'svelte';

	let current_theme = $state('light');

	const toggle_theme = () => {
		const new_theme = current_theme === 'light' ? 'dark' : 'light';
		current_theme = new_theme;

		if (browser) {
			document.documentElement.setAttribute('data-theme', new_theme);
			localStorage.setItem('theme', new_theme);
		}
	};

	onMount(() => {
		if (browser) {
			const stored_theme = localStorage.getItem('theme');
			const preferred_theme =
				stored_theme ||
				(window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light');

			current_theme = preferred_theme;
			document.documentElement.setAttribute(
				'data-theme',
				preferred_theme,
			);
		}
	});
</script>

<button
	class="btn btn-circle btn-ghost"
	onclick={toggle_theme}
	title="Toggle theme"
	aria-label="Toggle between light and dark theme"
>
	{#if current_theme === 'light'}
		<!-- Moon icon for dark mode -->
		<Moon class_names="h-5 w-5" />
	{:else}
		<!-- Sun icon for light mode -->
		<Sun class_names="h-5 w-5" />
	{/if}
</button>
