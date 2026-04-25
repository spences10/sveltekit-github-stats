<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import type { github_stats_result } from '$lib/github.remote';
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

	const format_hour = (hour: number): string => {
		if (hour === 0) return '12am';
		if (hour === 12) return '12pm';
		return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
	};

	type HourData = {
		hour: number;
		label: string;
		count: number;
		color: string;
	};

	const colors = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
	];

	const hour_data = $derived.by(() =>
		stats.hourly_commits
			.filter((h) => h.count > 0)
			.map((h, index) => ({
				hour: h.hour,
				label: format_hour(h.hour),
				count: h.count,
				color: colors[index % colors.length],
			})),
	);

	const peak = $derived.by(() =>
		hour_data.reduce<HourData | null>(
			(best, item) =>
				!best || item.count > best.count ? item : best,
			null,
		),
	);
</script>

<Card.Root class="chart-panel reveal-up">
	<Card.Header class="flex-row items-start justify-between gap-4">
		<div>
			<Card.Title>Work rhythm (UTC)</Card.Title>
			<Card.Description>
				Commit timing grouped by author timestamp hour.
			</Card.Description>
		</div>
		{#if peak}
			<Badge variant="secondary">Peak {peak.label}</Badge>
		{/if}
	</Card.Header>

	<Card.Content>
		{#if hour_data.length}
			<div style="height: {Math.max(hour_data.length * 30, 180)}px;">
				<Chart
					data={hour_data}
					x="count"
					xDomain={[0, null]}
					xNice
					y="label"
					yScale={scaleBand().padding(0.24)}
					c="label"
					cRange={hour_data.map((d) => d.color)}
					padding={{ left: 54, bottom: 28, right: 14, top: 8 }}
					tooltipContext={{ mode: 'band' }}
				>
					<Svg>
						<Axis placement="bottom" grid rule />
						<Axis placement="left" rule />
						<Bars radius={6} />
						<Highlight area />
					</Svg>

					<Tooltip.Root>
						{#snippet children({ data }: { data: HourData })}
							<Tooltip.Header>{data.label} UTC</Tooltip.Header>
							<Tooltip.List>
								<Tooltip.Item label="Commits" value={data.count} />
							</Tooltip.List>
						{/snippet}
					</Tooltip.Root>
				</Chart>
			</div>
		{:else}
			<div
				class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"
			>
				No hourly activity found for this range.
			</div>
		{/if}
	</Card.Content>
</Card.Root>
