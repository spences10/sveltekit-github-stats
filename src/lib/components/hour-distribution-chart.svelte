<script lang="ts">
	import type { github_stats_result } from '#lib/server/github-stats.js';
	import { scaleBand, scaleOrdinal } from 'd3-scale';
	import {
		Axis,
		BarChart,
		Bars,
		Chart,
		defaultChartPadding,
		Frame,
		Grid,
		isometric,
		LinearGradient,
		Svg,
		Tooltip,
	} from 'layerchart';
	import ChartViewControls from './chart-view-controls.svelte';
	import {
		create_isometric_view,
		tower_gradient,
	} from './isometric-view.svelte';

	let {
		stats,
		comparison_stats = null,
	}: {
		stats: github_stats_result;
		comparison_stats?: github_stats_result | null;
	} = $props();

	type HourCommit = { hour: number; count: number };

	const series = $derived([
		{
			key: 'primary' as const,
			label: `@${stats.username}`,
			color: 'var(--chart-1)',
		},
		...(comparison_stats
			? [
					{
						key: 'comparison' as const,
						label: `@${comparison_stats.username}`,
						color: 'var(--chart-2)',
					},
				]
			: []),
	]);

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

	// Each handle is a row of towers; the first handle stands in front
	const towers = $derived(
		series.flatMap((item) =>
			hour_data.map((bucket) => ({
				...bucket,
				series: item.key,
				value: bucket[item.key],
			})),
		),
	);
	const max_value = $derived(
		Math.max(1, ...towers.map((tower) => tower.value)),
	);

	// Opens as the flat bar chart; the towers are a turn away
	const view = create_isometric_view(
		() => ({ rotate: -30, tilt: 62 }),
		true,
	);

	// Each series is drawn as a gradient of its own, down every face
	const uid = $props.id();
	const gradient_id = (key: string) => `${uid}-fill-${key}`;

	const tick_label =
		'!stroke-transparent fill-muted-foreground text-[11px]';
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
		<div class="mb-2 flex items-center gap-4">
			{#if !view.flat}
				<p class="text-xs text-muted-foreground max-sm:hidden">
					Drag to turn
				</p>
			{/if}
			<div class="ml-auto">
				<ChartViewControls
					{view}
					can_flatten
					label="commit timing chart"
				/>
			</div>
		</div>
		{#if view.flat}
			<div class="reveal-up">
				<BarChart
					data={hour_data}
					x="label"
					{series}
					seriesLayout="group"
					padding={defaultChartPadding({ left: 8, right: 8 })}
					height={320}
				/>
			</div>
		{:else}
			<div
				class="h-80 cursor-grab touch-pan-y select-none active:cursor-grabbing"
			>
				<Chart
					data={towers}
					x="label"
					xScale={scaleBand().paddingInner(0.25).paddingOuter(0.15)}
					xDomain={hour_data.map((bucket) => bucket.label)}
					y="series"
					yScale={scaleBand().paddingInner(0.35).paddingOuter(0.2)}
					yDomain={series.map((item) => item.key).reverse()}
					z="value"
					valueAxis="z"
					zDomain={[0, max_value]}
					zNice
					zRange={({ width }: { width: number }) => [0, width * 0.4]}
					c="series"
					cScale={scaleOrdinal()}
					cDomain={series.map((item) => item.key)}
					cRange={series.map(
						(item) => `url(#${gradient_id(item.key)})`,
					)}
					view={isometric({
						...view.options,
						// Never a long thin strip, even for a single handle
						aspect: series.length > 1 ? 2.2 : 3.2,
					})}
					transform={{ mode: 'canvas', drag: 'rotate' }}
					onTransform={view.on_transform}
					ondragstart={view.drag_start}
					ondragend={view.drag_end}
					tooltipContext={{ mode: 'manual' }}
					padding={{ top: 12, bottom: 28, left: 36, right: 12 }}
					clip
				>
					<Svg>
						{#each series as item (item.key)}
							<LinearGradient
								id={gradient_id(item.key)}
								stops={tower_gradient(item.color)}
								vertical
							/>
						{/each}
						<Frame class="fill-foreground/3 stroke-foreground/15" />
						<Grid
							z
							classes={{ line: 'stroke-foreground opacity-15' }}
						/>
						<Axis
							placement="bottom"
							tickLabelProps={{ viewport: true }}
							classes={{ tickLabel: tick_label }}
						/>
						<Axis
							placement="back"
							ticks={3}
							format="integer"
							classes={{ tickLabel: tick_label }}
						/>
						<!-- Each tower is its own hit area: the floor cell under
						     the pointer may belong to a tower standing behind it -->
						<Bars
							tooltip
							strokeWidth={1}
							stroke="var(--card)"
							class="hour-tower"
						/>
					</Svg>

					<Tooltip.Root>
						{#snippet children({
							data,
						}: {
							data: (typeof hour_data)[number];
						})}
							<Tooltip.Header>{data.label} UTC</Tooltip.Header>
							<Tooltip.List>
								{#each series as item (item.key)}
									<Tooltip.Item
										label={item.label}
										value={data[item.key]}
										color={item.color}
									/>
								{/each}
							</Tooltip.List>
						{/snippet}
					</Tooltip.Root>
				</Chart>
			</div>
		{/if}
	</div>
</section>

<style>
	:global(.lc-rect-box:has(.hour-tower):hover .lc-rect) {
		filter: brightness(1.12);
	}
</style>
