<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { github_stats_result } from '$lib/github.remote';
	import { Chevron } from '$lib/icons';
	import { PieChart } from 'layerchart';

	let { stats }: { stats: github_stats_result } = $props();

	let sort_order: 'desc' | 'asc' = $state('desc');

	const colors = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
	];

	const pie_data = $derived.by(() => {
		const sorted = stats.repositories
			.map((repo) => ({
				key: repo.name,
				label: repo.name.split('/').pop() || repo.name,
				value: repo.commits,
				percentage: stats.total_commits
					? (repo.commits / stats.total_commits) * 100
					: 0,
			}))
			.sort((a, b) =>
				sort_order === 'desc' ? b.value - a.value : a.value - b.value,
			);

		return sorted.map((item, index) => ({
			...item,
			color: colors[index % colors.length],
		}));
	});

	const commit_label = (count: number) =>
		count === 1 ? '1 commit' : `${count} commits`;

	const toggle_sort = () => {
		sort_order = sort_order === 'desc' ? 'asc' : 'desc';
	};
</script>

<Card.Root class="chart-panel reveal-up">
	<Card.Header class="flex-row items-start justify-between gap-4">
		<div>
			<Card.Title>Workload share</Card.Title>
			<Card.Description>
				How the work split across repositories.
			</Card.Description>
		</div>
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
	</Card.Header>

	<Card.Content>
		{#if pie_data.length}
			<div class="grid min-w-0 gap-6">
				<div
					class="mx-auto flex size-52 items-center justify-center rounded-full bg-muted/40 p-3 sm:size-56"
				>
					<PieChart
						data={pie_data}
						key="key"
						label="label"
						value="value"
						c="key"
						cRange={pie_data.map((d) => d.color)}
						legend={false}
						innerRadius={0.58}
						padAngle={0.025}
						props={{ arc: { stroke: 'var(--card)', strokeWidth: 2 } }}
					/>
				</div>

				<div class="grid min-w-0 content-start gap-2">
					{#each pie_data.slice(0, 8) as segment (segment.key)}
						<div
							class="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2"
						>
							<div
								class="size-3 shrink-0 rounded-full"
								style="background-color: {segment.color}"
							></div>
							<div class="min-w-0 flex-1">
								<p
									class="truncate text-sm font-medium"
									title={segment.label}
								>
									{segment.label}
								</p>
								<p class="truncate text-sm text-muted-foreground">
									{commit_label(segment.value)} · {segment.percentage.toFixed(
										1,
									)}%
								</p>
							</div>
						</div>
					{/each}
					{#if pie_data.length > 8}
						<Badge variant="outline" class="w-fit">
							+{pie_data.length - 8} more repositories
						</Badge>
					{/if}
				</div>
			</div>
		{:else}
			<div
				class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"
			>
				No commits found for this range yet.
			</div>
		{/if}
	</Card.Content>
</Card.Root>
