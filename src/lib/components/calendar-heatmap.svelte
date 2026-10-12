<script lang="ts">
	type HeatmapDay = {
		date: Date;
		key: string;
		count: number;
		week: number;
		// Index into `colors`
		level: number;
	};

	let {
		days,
		week_count,
		username,
		colors,
		unit,
	}: {
		days: HeatmapDay[];
		week_count: number;
		username: string;
		colors: string[];
		// What a day's count is a count of, for the tooltip
		unit: string;
	} = $props();

	const weekday_labels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
	const label_width = 32;
	const gap = 3;

	// Each month is named once, over the week it starts in
	const month_labels = $derived.by(() => {
		const labels: { week: number; label: string }[] = [];
		let last_month = -1;
		let last_week = -1;
		for (const day of days) {
			const month = day.date.getMonth();
			if (month === last_month || day.week === last_week) continue;
			last_month = month;
			last_week = day.week;
			labels.push({
				week: day.week,
				label: day.date.toLocaleDateString('en', { month: 'short' }),
			});
		}
		// A sliver of a first month would sit under the next one's name
		if (labels.length > 1 && labels[1].week - labels[0].week < 2)
			labels.shift();
		return labels;
	});

	let wrapper = $state<HTMLElement>();
	let hovered = $state<{
		day: HeatmapDay;
		x: number;
		y: number;
	} | null>(null);

	// One listener for the grid, rather than one for every day
	const show_day = (event: PointerEvent) => {
		const cell = (event.target as HTMLElement).closest<HTMLElement>(
			'[data-day]',
		);
		const day = cell ? days[Number(cell.dataset.day)] : null;
		if (!cell || !day || !wrapper) {
			hovered = null;
			return;
		}
		const cell_box = cell.getBoundingClientRect();
		const wrapper_box = wrapper.getBoundingClientRect();
		hovered = {
			day,
			x: cell_box.left + cell_box.width / 2 - wrapper_box.left,
			y: cell_box.top - wrapper_box.top,
		};
	};

	const format_day = (date: Date) =>
		date.toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
</script>

<div class="reveal-up relative" bind:this={wrapper}>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll long calendars.) -->
	<div
		class="overflow-x-auto pb-1"
		tabindex="0"
		role="region"
		aria-label="{unit} heatmap for {username}; scroll to see all dates"
	>
		<!-- Shade carries the count; hovering a day gives the number, and
		     the table below the calendar carries them all -->
		<div
			class="heatmap-grid mx-auto grid text-[11px] text-muted-foreground"
			style:--heatmap-columns={week_count}
			style:--heatmap-label="{label_width - gap}px"
			style:gap="{gap}px"
			style:max-width="{label_width + week_count * 34}px"
			style:min-width="{label_width + week_count * 14}px"
			aria-hidden="true"
			onpointermove={show_day}
			onpointerleave={() => (hovered = null)}
		>
			{#each month_labels as month (month.week)}
				<span
					class="row-start-1 h-4 whitespace-nowrap"
					style:grid-column={month.week + 2}
				>
					{month.label}
				</span>
			{/each}
			{#each weekday_labels as weekday, index (index)}
				{#if weekday}
					<span
						class="col-start-1 self-center leading-none"
						style:grid-row={index + 2}
					>
						{weekday}
					</span>
				{/if}
			{/each}
			{#each days as day, index (day.key)}
				<span
					class="heatmap-cell aspect-square"
					style:background-color={colors[day.level]}
					style:grid-column={day.week + 2}
					style:grid-row={day.date.getDay() + 2}
					data-day={index}
				></span>
			{/each}
		</div>
	</div>

	{#if hovered}
		<div
			class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-md"
			style:left="{hovered.x}px"
			style:top="{hovered.y - 6}px"
		>
			<p class="text-muted-foreground">
				{format_day(hovered.day.date)}
			</p>
			<p class="mt-0.5 font-medium tabular-nums">
				{hovered.day.count.toLocaleString()}
				{unit.toLowerCase()}
			</p>
		</div>
	{/if}
</div>

<style>
	.heatmap-grid {
		grid-template-columns: var(--heatmap-label) repeat(
				var(--heatmap-columns),
				minmax(0, 1fr)
			);
	}

	.heatmap-cell {
		border-radius: 22%;
		box-shadow: inset 0 0 0 1px
			color-mix(in oklch, var(--foreground) 6%, transparent);
	}

	.heatmap-cell:hover {
		box-shadow: inset 0 0 0 1.5px
			color-mix(in oklch, var(--foreground) 70%, transparent);
	}
</style>
