<script lang="ts">
	import type { github_stats_result } from '$lib/server/github-stats';
	import { AreaChart, defaultChartPadding } from 'layerchart';
	import { SvelteDate } from 'svelte/reactivity';

	let { stats, comparison_stats = null } = $props<{
		stats: github_stats_result;
		comparison_stats?: github_stats_result | null;
	}>();

	type DailyCommit = { date: string; count: number };

	const daily_data = $derived.by(() => {
		const primary_counts = new Map<string, number>(
			stats.daily_commits.map(
				(item: DailyCommit): [string, number] => [
					item.date,
					item.count,
				],
			),
		);
		const comparison_counts = new Map<string, number>(
			comparison_stats?.daily_commits.map(
				(item: DailyCommit): [string, number] => [
					item.date,
					item.count,
				],
			) ?? [],
		);
		const result: Array<{
			date: Date;
			primary: number;
			comparison: number;
		}> = [];
		const current = new SvelteDate(`${stats.since}T12:00:00Z`);
		const end = new SvelteDate(`${stats.until}T12:00:00Z`);

		while (current <= end) {
			const date_key = current.toISOString().split('T')[0];
			result.push({
				date: new Date(current),
				primary: primary_counts.get(date_key) ?? 0,
				comparison: comparison_counts.get(date_key) ?? 0,
			});
			current.setUTCDate(current.getUTCDate() + 1);
		}

		return result;
	});

	const series = $derived([
		{
			key: 'primary',
			label: `@${stats.username}`,
			color: 'var(--chart-1)',
		},
		...(comparison_stats
			? [
					{
						key: 'comparison',
						label: `@${comparison_stats.username}`,
						color: 'var(--chart-2)',
					},
				]
			: []),
	]);
</script>

<section class="panel min-w-0 overflow-hidden">
	<header class="panel-header">
		<div>
			<p class="section-kicker">Daily activity</p>
			<h3 class="mt-1 font-semibold">Commits over time</h3>
		</div>
		<div class="flex flex-wrap gap-4 text-xs text-muted-foreground">
			<p class="flex items-center gap-1.5">
				<span class="size-2 rounded-full bg-chart-1"></span>
				@{stats.username}
			</p>
			{#if comparison_stats}
				<p class="flex items-center gap-1.5">
					<span class="size-2 rounded-full bg-chart-2"></span>
					@{comparison_stats.username}
				</p>
			{/if}
		</div>
	</header>

	<div class="p-3 sm:p-5">
		<AreaChart
			data={daily_data}
			x="date"
			{series}
			points
			padding={defaultChartPadding({ left: 8, right: 12 })}
			height={320}
		/>
	</div>
</section>
