<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { github_stats_result } from '$lib/github.remote';
	import { Chevron } from '$lib/icons';
	import { scaleBand } from 'd3-scale';
	import {
		Axis,
		Bars,
		Chart,
		Highlight,
		Svg,
		Tooltip,
	} from 'layerchart';

	let { stats }: { stats: github_stats_result } = $props();

	let sort_order: 'desc' | 'asc' = $state('desc');

	type RepoData = {
		name: string;
		full_name: string;
		commits: number;
		url: string;
		color: string;
	};

	const colors = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
	];

	const repo_data = $derived.by(() => {
		const sorted_repos = [...stats.repositories].sort((a, b) =>
			sort_order === 'desc'
				? b.commits - a.commits
				: a.commits - b.commits,
		);

		return sorted_repos.map((repo, index) => ({
			name: repo.name.split('/').pop() || repo.name,
			full_name: repo.name,
			commits: repo.commits,
			url: repo.url,
			color: colors[index % colors.length],
		}));
	});

	const toggle_sort = () => {
		sort_order = sort_order === 'desc' ? 'asc' : 'desc';
	};
</script>

<Card.Root class="chart-panel reveal-up">
	<Card.Header class="flex-row items-start justify-between gap-4">
		<div>
			<Card.Title>Repository focus</Card.Title>
			<Card.Description>
				Where the selected commits landed.
			</Card.Description>
		</div>
		<div class="flex items-center gap-2">
			<Badge variant="secondary">{repo_data.length} repos</Badge>
			<Button
				variant="ghost"
				size="icon"
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
			</Button>
		</div>
	</Card.Header>

	<Card.Content>
		{#if repo_data.length}
			<div style="height: {Math.max(repo_data.length * 34, 220)}px;">
				<Chart
					data={repo_data}
					x="commits"
					xDomain={[0, null]}
					xNice
					y="name"
					yScale={scaleBand().padding(0.28)}
					c="name"
					cRange={repo_data.map((d) => d.color)}
					padding={{ left: 118, bottom: 28, right: 14, top: 8 }}
					tooltipContext={{ mode: 'band' }}
				>
					<Svg>
						<Axis placement="bottom" grid rule />
						<Axis placement="left" rule />
						<Bars radius={6} />
						<Highlight area />
					</Svg>

					<Tooltip.Root>
						{#snippet children({ data }: { data: RepoData })}
							<Tooltip.Header>
								<!-- eslint-disable svelte/no-navigation-without-resolve -->
								<a
									href={data.url}
									target="_blank"
									rel="noopener noreferrer"
									class="hover:underline"
								>
									{data.full_name}
								</a>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							</Tooltip.Header>
							<Tooltip.List>
								<Tooltip.Item label="Commits" value={data.commits} />
							</Tooltip.List>
						{/snippet}
					</Tooltip.Root>
				</Chart>
			</div>
		{:else}
			<div
				class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"
			>
				No repository activity found for this range.
			</div>
		{/if}
	</Card.Content>
</Card.Root>
