<script lang="ts">
	import type { github_stats_result } from '#lib/server/github-stats.js';
	import { scaleThreshold } from 'd3-scale';
	import { Calendar, Chart, Layer, Tooltip } from 'layerchart';

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
				const start = calendar_date(result.since);
				const exclusive_end = calendar_date(result.until);
				exclusive_end.setDate(exclusive_end.getDate() + 1);
				const weeks = Math.ceil((days.length + start.getDay()) / 7);
				return { result, days, start, end: exclusive_end, weeks };
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
				Each square is one UTC day. Stronger colour means more
				commits.
			</p>
		</div>
	</header>
	{#each datasets as dataset, index (index)}
		<div class="min-w-0 border-t p-5 first-of-type:border-t-0 sm:p-6">
			<p class="mb-5 truncate font-mono text-sm">
				@{dataset.result.username}
			</p>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll long calendars.) -->
			<div
				class="overflow-x-auto"
				tabindex="0"
				role="region"
				aria-label={`Commit heatmap for ${dataset.result.username}; scroll to see all dates`}
			>
				<div
					class="min-w-(--calendar-width)"
					style={`--calendar-width: ${dataset.weeks * 22 + 36}px`}
				>
					<Chart
						data={dataset.days}
						x="date"
						c="count"
						cScale={scaleThreshold()}
						cDomain={thresholds}
						cRange={colors}
						height={182}
						padding={{ top: 24, left: 30, right: 4, bottom: 4 }}
					>
						<Layer>
							{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day, i (day)}
								<text
									x={-6}
									y={i * 22 + 14}
									text-anchor="end"
									class="fill-muted-foreground text-[0.625rem]"
									>{day}</text
								>
							{/each}
							<Calendar
								start={dataset.start}
								end={dataset.end}
								cellSize={22}
								tooltip
								class="stroke-card stroke-2"
							/>
						</Layer>
						<Tooltip.Root>
							{#snippet children({ data })}
								<Tooltip.Header value={data.date} format="day" />
								<Tooltip.List
									><Tooltip.Item
										label="Commits"
										value={data.count}
									/></Tooltip.List
								>
							{/snippet}
						</Tooltip.Root>
					</Chart>
				</div>
			</div>
			<details class="mt-4 text-base sm:text-sm">
				<summary
					class="cursor-pointer text-muted-foreground hover:text-foreground"
					>View daily counts</summary
				>
				<div class="mt-3 max-h-60 overflow-auto">
					<table class="w-full text-left tabular-nums">
						<caption class="sr-only"
							>Daily public commit counts for {dataset.result
								.username}</caption
						><thead
							><tr
								><th class="py-2 font-medium">Date (UTC)</th><th
									class="py-2 text-right font-medium">Commits</th
								></tr
							></thead
						><tbody>
							{#each dataset.days as day (day.key)}<tr
									class="border-t"
									><td class="py-2">{day.key}</td><td
										class="py-2 text-right">{day.count}</td
									></tr
								>{/each}
						</tbody>
					</table>
				</div>
			</details>
		</div>
	{/each}
	<div
		class="flex flex-wrap gap-4 border-t px-5 py-4 text-sm text-muted-foreground sm:px-6"
		aria-label="Commit count legend"
	>
		{#each colors as color, index (color)}
			<span class="flex items-center gap-2"
				><span
					class="size-3 bg-(--swatch)"
					style={`--swatch: ${color}`}
				></span>{index === 0
					? '0'
					: `${thresholds[index - 1]}${index === colors.length - 1 ? '+' : thresholds[index] - 1 > thresholds[index - 1] ? `–${thresholds[index] - 1}` : ''}`}</span
			>
		{/each}
		<span>commits per day</span>
	</div>
</section>
