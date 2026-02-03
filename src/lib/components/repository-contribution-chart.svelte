<script lang="ts">
	import { browser } from '$app/environment';
	import type { github_stats_result } from '$lib/github.remote';
	import { Chevron } from '$lib/icons';
	import { scaleBand, scaleOrdinal } from 'd3-scale';
	import {
		Axis,
		Bars,
		Chart,
		Highlight,
		Svg,
		Tooltip,
	} from 'layerchart';
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

	type RepoData = {
		name: string;
		full_name: string;
		commits: number;
		url: string;
		color: string;
	};

	const get_bar_color = (
		commits: number,
		max_commits: number,
		theme: string,
	): string => {
		const percentage = (commits / max_commits) * 100;
		const is_dark = theme === 'dark';
		// Adjust lightness for dark theme
		if (percentage >= 80)
			return is_dark
				? 'oklch(0.75 0.19 142)'
				: 'oklch(0.65 0.19 142)'; // success green
		if (percentage >= 60)
			return is_dark
				? 'oklch(0.75 0.16 231)'
				: 'oklch(0.65 0.16 231)'; // info blue
		if (percentage >= 40)
			return is_dark ? 'oklch(0.82 0.18 84)' : 'oklch(0.72 0.18 84)'; // warning yellow
		return is_dark ? 'oklch(0.70 0.20 27)' : 'oklch(0.60 0.20 27)'; // error/orange
	};

	const repo_data = $derived.by(() => {
		const all_repos = stats.repositories;
		const max_commits = Math.max(
			...all_repos.map((repo) => repo.commits),
			1,
		);

		const mapped_repos: RepoData[] = all_repos.map((repo) => ({
			name: repo.name.split('/').pop() || repo.name,
			full_name: repo.name,
			commits: repo.commits,
			url: repo.url,
			color: get_bar_color(repo.commits, max_commits, current_theme),
		}));

		return mapped_repos.sort((a, b) =>
			sort_order === 'desc'
				? b.commits - a.commits
				: a.commits - b.commits,
		);
	});

	const color_scale = $derived(
		scaleOrdinal<string, string>()
			.domain(repo_data.map((d) => d.name))
			.range(repo_data.map((d) => d.color)),
	);

	const toggle_sort = () => {
		sort_order = sort_order === 'desc' ? 'asc' : 'desc';
	};
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="flex items-center justify-between">
			<h3 class="card-title">
				<span class="text-primary">📊</span>
				Repository Contributions
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

		<div
			class="mt-4"
			style="height: {Math.max(repo_data.length * 36, 200)}px;"
		>
			<Chart
				data={repo_data}
				x="commits"
				xDomain={[0, null]}
				xNice
				y="name"
				yScale={scaleBand().padding(0.3)}
				c="name"
				cScale={color_scale}
				padding={{ left: 120, bottom: 24, right: 16 }}
				tooltip={{ mode: 'band' }}
			>
				<Svg>
					<Axis placement="bottom" grid rule />
					<Axis placement="left" rule />
					<Bars radius={4} />
					<Highlight area />
				</Svg>

				<Tooltip.Root>
					{#snippet children({ data }: { data: RepoData })}
						<Tooltip.Header>
							<a
								href={data.url}
								target="_blank"
								rel="noopener noreferrer"
								class="hover:underline"
							>
								{data.full_name}
							</a>
						</Tooltip.Header>
						<Tooltip.List>
							<Tooltip.Item label="Commits" value={data.commits} />
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			</Chart>
		</div>
	</div>
</div>
