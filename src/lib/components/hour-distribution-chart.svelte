<script lang="ts">
	import type { github_stats_result } from '$lib/server/github-stats';
	import { BarChart, defaultChartPadding } from 'layerchart';

	let { stats, comparison_stats = null } = $props<{
		stats: github_stats_result;
		comparison_stats?: github_stats_result | null;
	}>();

	type HourCommit = { hour: number; count: number };

	const hour_data = $derived.by(() =>
		Array.from({ length: 8 }, (_, index) => {
			const start_hour = index * 3;
			const end_hour = start_hour + 2;
			return {
				label: `${start_hour.toString().padStart(2, '0')}–${end_hour
					.toString()
					.padStart(2, '0')}`,
				primary: stats.hourly_commits
					.slice(start_hour, end_hour + 1)
					.reduce(
						(total: number, item: HourCommit) => total + item.count,
						0,
					),
				comparison: comparison_stats
					? comparison_stats.hourly_commits
							.slice(start_hour, end_hour + 1)
							.reduce(
								(total: number, item: HourCommit) =>
									total + item.count,
								0,
							)
					: 0,
			};
		}),
	);

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
			<p class="section-kicker">Commit timing</p>
			<h3 class="mt-1 font-semibold">Activity by UTC hour</h3>
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
		<BarChart
			data={hour_data}
			x="label"
			{series}
			seriesLayout="group"
			padding={defaultChartPadding({ left: 8, right: 8 })}
			height={320}
		/>
	</div>
</section>
