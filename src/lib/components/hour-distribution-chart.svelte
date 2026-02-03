<script lang="ts">
	import { browser } from '$app/environment';
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
	import { onMount } from 'svelte';

	let { stats }: { stats: github_stats_result } = $props();

	let current_theme = $state('light');

	onMount(() => {
		if (browser) {
			current_theme =
				document.documentElement.getAttribute('data-theme') ||
				'light';
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

	// Same colors as pie chart
	const get_colors = (theme: string) => {
		const is_dark = theme === 'dark';
		return is_dark
			? [
					'oklch(0.70 0.20 260)', // primary blue
					'oklch(0.75 0.18 320)', // secondary purple
					'oklch(0.78 0.16 231)', // info cyan
					'oklch(0.78 0.19 142)', // success green
					'oklch(0.85 0.18 84)', // warning yellow
					'oklch(0.72 0.20 27)', // error orange
				]
			: [
					'oklch(0.55 0.20 260)', // primary blue
					'oklch(0.60 0.18 320)', // secondary purple
					'oklch(0.62 0.16 231)', // info cyan
					'oklch(0.62 0.19 142)', // success green
					'oklch(0.70 0.18 84)', // warning yellow
					'oklch(0.55 0.20 27)', // error orange
				];
	};

	const hour_data = $derived.by(() => {
		const with_commits = stats.hourly_commits.filter(
			(h) => h.count > 0,
		);
		const colors = get_colors(current_theme);

		return with_commits.map((h, index) => ({
			hour: h.hour,
			label: format_hour(h.hour),
			count: h.count,
			color: colors[index % colors.length],
		}));
	});
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h3 class="card-title">
			<span class="text-primary">🕐</span>
			Commits by Hour (UTC)
		</h3>

		<div
			class="mt-4"
			style="height: {Math.max(hour_data.length * 28, 120)}px;"
		>
			<Chart
				data={hour_data}
				x="count"
				xDomain={[0, null]}
				xNice
				y="label"
				yScale={scaleBand().padding(0.2)}
				c="label"
				cRange={hour_data.map((d) => d.color)}
				padding={{ left: 48, bottom: 24, right: 16 }}
				tooltip={{ mode: 'band' }}
			>
				<Svg>
					<Axis placement="bottom" grid rule />
					<Axis placement="left" rule />
					<Bars radius={4} />
					<Highlight area />
				</Svg>

				<Tooltip.Root>
					{#snippet children({ data }: { data: HourData })}
						<Tooltip.Header>{data.label}</Tooltip.Header>
						<Tooltip.List>
							<Tooltip.Item label="Commits" value={data.count} />
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			</Chart>
		</div>
	</div>
</div>
