<script lang="ts">
	import type { github_stats_result } from '#lib/server/github-stats.js';
	import CalendarLegend from './calendar-legend.svelte';
	import CommitSkyline from './commit-skyline.svelte';
	import DailyCountsTable from './daily-counts-table.svelte';

	let { stats, comparison_stats = null } = $props<{
		stats: github_stats_result;
		comparison_stats?: github_stats_result | null;
	}>();
	// Calendar lays out local calendar dates; construct from date parts so
	// the UTC date keys from GitHub do not shift in the viewer's timezone.
	const calendar_date = (date: string) => {
		const [year, month, day] = date.split('-').map(Number);
		return new Date(year, month - 1, day);
	};
	const datasets = $derived(
		[stats, ...(comparison_stats ? [comparison_stats] : [])].map(
			(result) => {
				const counts = new Map<string, number>(
					result.daily_commits.map(
						(day: {
							date: string;
							count: number;
						}): [string, number] => [day.date, day.count],
					),
				);
				const days = [];
				const current = new Date(`${result.since}T00:00:00Z`);
				const end = new Date(`${result.until}T00:00:00Z`);
				while (current <= end) {
					const key = current.toISOString().slice(0, 10);
					days.push({
						date: calendar_date(key),
						key,
						count: counts.get(key) ?? 0,
					});
					current.setUTCDate(current.getUTCDate() + 1);
				}
				return { result, days };
			},
		),
	);
	const maximum = $derived(
		Math.max(
			1,
			...datasets.flatMap((dataset) =>
				dataset.days.map((day) => day.count),
			),
		),
	);
	const thresholds = $derived(
		[
			...new Set([
				1,
				Math.ceil(maximum / 3),
				Math.ceil((maximum * 2) / 3),
			]),
		].sort((a, b) => a - b),
	);
	const colors = $derived([
		'var(--muted)',
		...thresholds.map(
			(_, index) =>
				`color-mix(in oklch, var(--chart-1) ${Math.round(((index + 1) / thresholds.length) * 100)}%, var(--card))`,
		),
	]);
</script>

<section
	class="panel min-w-0 overflow-hidden"
	aria-label="Commit calendar"
>
	<header class="panel-header">
		<div>
			<p class="section-kicker">Commit calendar</p>
			<h3 class="mt-1 font-semibold text-balance">Commits by day</h3>
			<p class="mt-2 text-base text-muted-foreground sm:text-sm">
				Each tower is one UTC day. Taller and stronger colour means
				more commits.
			</p>
		</div>
	</header>
	{#each datasets as dataset, index (index)}
		<div class="min-w-0 border-t p-5 first-of-type:border-t-0 sm:p-6">
			<CommitSkyline
				days={dataset.days}
				username={dataset.result.username}
				{maximum}
				{thresholds}
				{colors}
			/>
			<DailyCountsTable
				days={dataset.days}
				summary="View daily counts"
				caption="Daily public commit counts for {dataset.result
					.username}"
				unit="Commits"
			/>
		</div>
	{/each}
	<CalendarLegend {thresholds} {colors} unit="commits per day" />
</section>
