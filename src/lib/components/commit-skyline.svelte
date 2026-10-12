<script lang="ts">
	import { scaleBand, scaleOrdinal } from 'd3-scale';
	import {
		Axis,
		Bars,
		Chart,
		Frame,
		Grid,
		isometric,
		LinearGradient,
		Svg,
		Text,
		Tooltip,
	} from 'layerchart';
	import { untrack } from 'svelte';
	import CalendarHeatmap from './calendar-heatmap.svelte';
	import ChartViewControls from './chart-view-controls.svelte';
	import {
		create_isometric_view,
		tower_gradient,
	} from './isometric-view.svelte';

	export type SkylineDay = {
		date: Date;
		key: string;
		count: number;
	};

	let {
		days,
		username,
		maximum,
		thresholds,
		colors,
		unit = 'Commits',
		label = `${username} commit calendar`,
		start_flat = false,
		detail = '',
	}: {
		days: SkylineDay[];
		username: string;
		// Shared by every handle on the page, so towers compare
		maximum: number;
		thresholds: number[];
		colors: string[];
		// What a day's count is a count of, for the tooltip
		unit?: string;
		// What the view buttons act on
		label?: string;
		// Open as the flat heatmap rather than the towers
		start_flat?: boolean;
		// A line beside the handle, such as its total
		detail?: string;
	} = $props();

	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Each fill is drawn as a gradient of its own, down every face
	const uid = $props.id();
	const gradient_id = (index: number) => `${uid}-fill-${index}`;

	// Weeks run across and weekdays step back, as on a calendar
	const towers = $derived.by(() => {
		const offset = days[0]?.date.getDay() ?? 0;
		return days.map((day, index) => {
			const level = thresholds.filter(
				(threshold) => day.count >= threshold,
			).length;
			return {
				...day,
				week: Math.floor((index + offset) / 7),
				weekday: weekdays[day.date.getDay()],
				level,
				fill: colors[level],
			};
		});
	});
	const weeks = $derived(
		Array.from(
			{ length: (towers.at(-1)?.week ?? 0) + 1 },
			(_, i) => i,
		),
	);

	// A long range is a strip, seen more side on than a short one
	const long = $derived(weeks.length > 14);
	const view = create_isometric_view(
		() =>
			long ? { rotate: -10, tilt: 62 } : { rotate: -32, tilt: 60 },
		untrack(() => start_flat),
	);

	// Narrow charts have no room for whole labels
	let chart_width = $state(0);
	const compact = $derived(chart_width > 0 && chart_width < 560);

	// Long ranges name each month once, short ones each week
	const week_labels = $derived.by(() => {
		const labels = new Map<number, string>();
		let last_month = -1;
		for (const tower of towers) {
			if (labels.has(tower.week)) continue;
			const month = tower.date.getMonth();
			if (long && month === last_month) continue;
			last_month = month;
			labels.set(
				tower.week,
				tower.date.toLocaleDateString(
					'en',
					long
						? { month: 'short' }
						: { month: 'short', day: 'numeric' },
				),
			);
		}
		return labels;
	});

	// The one direct label: the busiest day
	const peak = $derived.by(() => {
		const busiest = towers.reduce<(typeof towers)[number] | null>(
			(best, tower) =>
				tower.count > (best?.count ?? 0) ? tower : best,
			null,
		);
		return busiest ? [busiest] : [];
	});

	const tick_label =
		'!stroke-transparent fill-muted-foreground text-[11px]';
</script>

<div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
	<p class="truncate font-mono text-sm">@{username}</p>
	{#if detail}
		<p class="text-sm text-muted-foreground">{detail}</p>
	{/if}
	{#if !view.flat}
		<p class="text-xs text-muted-foreground max-sm:hidden">
			Drag to turn
		</p>
	{/if}
	<div class="ml-auto">
		<ChartViewControls {view} can_flatten {label} />
	</div>
</div>

{#if view.flat}
	<CalendarHeatmap
		days={towers}
		week_count={weeks.length}
		{username}
		{colors}
		{unit}
	/>
{:else}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll long calendars.) -->
	<div
		class="overflow-x-auto"
		tabindex="0"
		role="region"
		aria-label="Commit skyline for {username}; scroll to see all dates"
	>
		<!-- A long calendar scrolls sideways on a narrow screen, so a touch
	     there pans the page and the buttons turn the chart -->
		<div
			class={[
				'h-64 min-w-(--skyline-width) cursor-grab touch-pan-y select-none active:cursor-grabbing',
				long ? 'touch-pan-x sm:h-80' : 'sm:h-96',
			]}
			style:--skyline-width="{weeks.length * 12}px"
			bind:clientWidth={chart_width}
		>
			<Chart
				data={towers}
				x="week"
				xScale={scaleBand().paddingInner(0.14).paddingOuter(0.1)}
				xDomain={weeks}
				y="weekday"
				yScale={scaleBand().paddingInner(0.14).paddingOuter(0.1)}
				yDomain={weekdays}
				z="count"
				valueAxis="z"
				zDomain={[0, maximum]}
				zNice
				zRange={({ height }: { height: number }) => [
					0,
					height * 0.55,
				]}
				c="fill"
				cScale={scaleOrdinal()}
				cDomain={colors}
				cRange={colors.map(
					(_, index) => `url(#${gradient_id(index)})`,
				)}
				view={isometric(view.options)}
				transform={{ mode: 'canvas', drag: 'rotate' }}
				onTransform={view.on_transform}
				ondragstart={view.drag_start}
				ondragend={view.drag_end}
				tooltipContext={{ mode: 'manual' }}
				padding={{ top: 16, bottom: 28, left: 40, right: 16 }}
				clip
			>
				<Svg>
					{#each colors as color, index (index)}
						<LinearGradient
							id={gradient_id(index)}
							stops={tower_gradient(color)}
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
						ticks={[...week_labels.keys()]}
						format={(week: number) => week_labels.get(week) ?? ''}
						tickLabelProps={{ viewport: true }}
						classes={{ tickLabel: tick_label }}
					/>
					<Axis
						placement="left"
						ticks={long ? ['Mon', 'Wed', 'Fri'] : weekdays}
						format={(day: string) => (compact ? day[0] : day)}
						tickLabelProps={{ viewport: true }}
						classes={{ tickLabel: tick_label }}
					/>
					<Axis
						placement="back"
						ticks={3}
						format="integer"
						classes={{ tickLabel: tick_label }}
					/>
					<!-- Each tower is its own hit area: the floor cell under the
				     pointer may belong to a tower standing behind it -->
					<Bars
						tooltip
						strokeWidth={1}
						stroke="var(--card)"
						class="skyline-tower"
					/>
					{#if peak.length > 0}
						<Text
							data={peak}
							x="week"
							y="weekday"
							z="count"
							value="count"
							viewport
							textAnchor="middle"
							dy={-10}
							class="pointer-events-none fill-foreground stroke-card! stroke-[3px] text-xs font-semibold [paint-order:stroke]"
						/>
					{/if}
				</Svg>

				<Tooltip.Root>
					{#snippet children({ data }: { data: SkylineDay })}
						<Tooltip.Header value={data.date} format="day" />
						<Tooltip.List>
							<Tooltip.Item label={unit} value={data.count} />
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			</Chart>
		</div>
	</div>
{/if}

<style>
	:global(.lc-rect-box:has(.skyline-tower):hover .lc-rect) {
		filter: brightness(1.12);
	}
</style>
