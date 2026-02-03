<script lang="ts">
	import { browser } from '$app/environment';
	import { scaleQuantize } from 'd3-scale';
	import { Chart, Group, Rect, Svg, Tooltip } from 'layerchart';
	import { onMount } from 'svelte';

	type DailyCommit = { date: string; count: number };

	let { daily_commits }: { daily_commits: DailyCommit[] } = $props();

	const cell_size = 12;
	const cell_gap = 2;

	// Track theme for reactive color updates
	let current_theme = $state('light');

	onMount(() => {
		if (browser) {
			current_theme =
				document.documentElement.getAttribute('data-theme') ||
				'light';
			// Watch for theme changes
			const observer = new MutationObserver(() => {
				current_theme =
					document.documentElement.getAttribute('data-theme') ||
					'light';
			});
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme'],
			});
			return () => observer.disconnect();
		}
	});

	// Build lookup map for commits by date
	const commit_map = $derived(
		new Map(daily_commits.map((d) => [d.date, d.count])),
	);

	// Get date range from data
	const date_range = $derived(() => {
		if (daily_commits.length === 0)
			return { start: new Date(), end: new Date() };
		const dates = daily_commits.map((d) => new Date(d.date));
		return {
			start: new Date(Math.min(...dates.map((d) => d.getTime()))),
			end: new Date(Math.max(...dates.map((d) => d.getTime()))),
		};
	});

	// Generate all weeks and days in range
	const calendar_data = $derived(() => {
		const { start, end } = date_range();
		const weeks: Array<{
			week: number;
			days: Array<{
				date: string;
				count: number;
				day_of_week: number;
			}>;
		}> = [];

		// Start from the beginning of the week containing start date
		const current = new Date(start);
		current.setDate(current.getDate() - current.getDay());

		let week_index = 0;
		while (current <= end || weeks.length === 0) {
			const week_days: Array<{
				date: string;
				count: number;
				day_of_week: number;
			}> = [];

			for (let day = 0; day < 7; day++) {
				const date_str = current.toISOString().split('T')[0];
				const is_in_range = current >= start && current <= end;
				week_days.push({
					date: date_str,
					count: is_in_range ? commit_map.get(date_str) || 0 : -1,
					day_of_week: day,
				});
				current.setDate(current.getDate() + 1);
			}

			weeks.push({ week: week_index, days: week_days });
			week_index++;

			if (current > end) break;
		}

		return weeks;
	});

	// Max commits for color scaling
	const max_count = $derived(
		Math.max(1, ...daily_commits.map((d) => d.count)),
	);

	// Theme-aware color scales
	const get_color_scale = (theme: string) => {
		const is_dark = theme === 'dark';
		return scaleQuantize<string>()
			.domain([0, max_count])
			.range(
				is_dark
					? [
							'oklch(0.25 0.02 145)', // Very dark (0 commits)
							'oklch(0.35 0.10 145)', // Dark green
							'oklch(0.50 0.15 145)', // Medium green
							'oklch(0.65 0.18 145)', // Light green
							'oklch(0.75 0.16 145)', // Bright green
						]
					: [
							'oklch(0.95 0.02 145)', // Very light (0 commits)
							'oklch(0.85 0.10 145)', // Light green
							'oklch(0.65 0.15 145)', // Medium green
							'oklch(0.50 0.18 145)', // Dark green
							'oklch(0.38 0.16 145)', // Very dark green
						],
			);
	};

	const color_scale = $derived(get_color_scale(current_theme));

	const get_color = (count: number): string => {
		if (count < 0) return 'transparent';
		const is_dark = current_theme === 'dark';
		if (count === 0)
			return is_dark
				? 'oklch(0.25 0.02 145)'
				: 'oklch(0.95 0.02 145)';
		return color_scale(count);
	};

	// Format date for display
	const format_date = (date_str: string): string => {
		const date = new Date(date_str);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	// Chart dimensions
	const chart_width = $derived(
		calendar_data().length * (cell_size + cell_gap) + 40,
	);
	const chart_height = 7 * (cell_size + cell_gap) + 20;

	// Day labels
	const day_labels = [
		'Sun',
		'Mon',
		'Tue',
		'Wed',
		'Thu',
		'Fri',
		'Sat',
	];
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h3 class="card-title">
			<span class="text-success">📅</span>
			Activity Heatmap
		</h3>

		<div class="mt-4 overflow-x-auto">
			<div class="flex gap-2">
				<!-- Day labels -->
				<div
					class="flex flex-col justify-between pr-2 text-xs text-base-content/60"
					style="height: {7 *
						(cell_size + cell_gap)}px; padding-top: 2px;"
				>
					{#each day_labels as label, i}
						{#if i % 2 === 1}
							<span
								style="height: {cell_size}px; line-height: {cell_size}px;"
								>{label}</span
							>
						{:else}
							<span style="height: {cell_size}px;"></span>
						{/if}
					{/each}
				</div>

				<!-- Heatmap grid -->
				<div
					class="relative"
					style="width: {chart_width - 40}px; height: {chart_height -
						20}px;"
				>
					<Chart
						data={calendar_data().flatMap((week) =>
							week.days.map((day) => ({
								...day,
								week: week.week,
								x: week.week * (cell_size + cell_gap),
								y: day.day_of_week * (cell_size + cell_gap),
							})),
						)}
						x="x"
						y="y"
						padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
						tooltip={{ mode: 'quadtree' }}
					>
						<Svg>
							{#each calendar_data() as week}
								<Group x={week.week * (cell_size + cell_gap)} y={0}>
									{#each week.days as day}
										{#if day.count >= 0}
											<Rect
												x={0}
												y={day.day_of_week * (cell_size + cell_gap)}
												width={cell_size}
												height={cell_size}
												rx={2}
												fill={get_color(day.count)}
												class="stroke-base-content/10 stroke-1 transition-all hover:stroke-base-content/30"
											/>
										{/if}
									{/each}
								</Group>
							{/each}
						</Svg>
						<Tooltip.Root>
							{#snippet children({
								data,
							}: {
								data: { date: string; count: number };
							})}
								{#if data && data.count >= 0}
									<Tooltip.Header
										>{format_date(data.date)}</Tooltip.Header
									>
									<Tooltip.List>
										<Tooltip.Item
											label="Commits"
											value={data.count}
										/>
									</Tooltip.List>
								{/if}
							{/snippet}
						</Tooltip.Root>
					</Chart>
				</div>
			</div>

			<!-- Legend -->
			<div
				class="mt-4 flex items-center justify-end gap-2 text-xs text-base-content/60"
			>
				<span>Less</span>
				<div class="flex gap-1">
					{#each [0, Math.ceil(max_count * 0.25), Math.ceil(max_count * 0.5), Math.ceil(max_count * 0.75), max_count] as level}
						<div
							class="h-3 w-3 rounded-sm"
							style="background-color: {get_color(level)};"
							title="{level} commits"
						></div>
					{/each}
				</div>
				<span>More</span>
			</div>
		</div>
	</div>
</div>
