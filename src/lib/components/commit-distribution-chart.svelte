<script lang="ts">
	import { browser } from '$app/environment';
	import type { github_stats_result } from '$lib/github.remote';
	import { Chevron } from '$lib/icons';
	import { PieChart } from 'layerchart';
	import { onMount } from 'svelte';

	let { stats }: { stats: github_stats_result } = $props();

	let sort_order: 'desc' | 'asc' = $state('desc');

	// Track theme for reactive styling
	let current_theme = $state('light');

	onMount(() => {
		if (browser) {
			current_theme =
				document.documentElement.getAttribute('data-theme') ||
				'light';
			const observer = new MutationObserver(() => {
				current_theme =
					document.documentElement.getAttribute('data-theme') ||
					'light';
			});
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme'],
			});
			return () => observer.disconnect();
		}
	});

	type PieDataItem = {
		key: string;
		label: string;
		value: number;
		percentage: number;
	};

	// Theme-aware colors
	const get_colors = (theme: string) => {
		const is_dark = theme === 'dark';
		return is_dark
			? [
					'oklch(0.70 0.20 260)', // primary blue
					'oklch(0.75 0.18 320)', // secondary purple
					'oklch(0.78 0.16 231)', // info cyan
					'oklch(0.78 0.19 142)', // success green
					'oklch(0.85 0.18 84)', // warning yellow
					'oklch(0.72 0.20 27)', // error orange
				]
			: [
					'oklch(0.55 0.20 260)', // primary blue
					'oklch(0.60 0.18 320)', // secondary purple
					'oklch(0.62 0.16 231)', // info cyan
					'oklch(0.62 0.19 142)', // success green
					'oklch(0.70 0.18 84)', // warning yellow
					'oklch(0.55 0.20 27)', // error orange
				];
	};

	const pie_data = $derived.by(() => {
		const data: PieDataItem[] = stats.repositories.map(
			(repo: { name: string; commits: number }) => ({
				key: repo.name,
				label: repo.name.split('/').pop() || repo.name,
				value: repo.commits,
				percentage: (repo.commits / stats.total_commits) * 100,
			}),
		);

		return data.sort((a, b) =>
			sort_order === 'desc' ? b.value - a.value : a.value - b.value,
		);
	});

	const toggle_sort = () => {
		sort_order = sort_order === 'desc' ? 'asc' : 'desc';
	};
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="flex items-center justify-between">
			<h3 class="card-title">
				<span class="text-primary">🥧</span>
				Commit Distribution
			</h3>
			<button
				class="btn btn-ghost btn-sm"
				onclick={toggle_sort}
				title={sort_order === 'desc'
					? 'Sort ascending'
					: 'Sort descending'}
			>
				<Chevron
					height="16px"
					width="16px"
					rotated={sort_order === 'desc'}
				/>
			</button>
		</div>

		<div class="mt-4 flex flex-col gap-6 lg:flex-row">
			<div class="flex h-48 w-48 justify-center">
				<PieChart
					data={pie_data}
					key="key"
					label="label"
					value="value"
					legend={false}
					innerRadius={0.5}
					padAngle={0.02}
				/>
			</div>

			<div class="flex-1 space-y-2">
				{#each pie_data as segment, index}
					{@const colors = get_colors(current_theme)}
					<div class="flex items-center gap-3">
						<div
							class="h-4 w-4 shrink-0 rounded-full"
							style="background-color: {colors[
								index % colors.length
							]}"
						></div>
						<div class="min-w-0 flex-1">
							<div
								class="truncate text-sm font-medium"
								title={segment.label}
							>
								{segment.label}
							</div>
							<div class="text-xs text-base-content/60">
								{segment.value} commits ({segment.percentage.toFixed(
									1,
								)}%)
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="mt-2 text-center text-sm text-base-content/60">
			Total: {stats.total_commits} commits
		</div>
	</div>
</div>
