<script lang="ts">
	import { browser } from '$app/environment';
	import { scaleLinear, scaleTime } from 'd3-scale';
	import {
		Area,
		Axis,
		Chart,
		Highlight,
		Svg,
		Tooltip,
	} from 'layerchart';
	import { onMount } from 'svelte';

	type DailyCommit = {
		date: string;
		count: number;
	};

	let { daily_commits }: { daily_commits: DailyCommit[] } = $props();

	// Track theme for reactive styling
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

	const chart_data = $derived(
		daily_commits.map((d) => ({
			date: new Date(d.date),
			count: d.count,
		})),
	);

	const format_date = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	};

	// Theme-aware colors
	const area_fill = $derived(
		current_theme === 'dark' ? 'fill-primary/30' : 'fill-primary/20',
	);
	const grid_class = $derived(
		current_theme === 'dark'
			? 'stroke-base-content/15'
			: 'stroke-base-content/10',
	);
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h3 class="card-title">
			<span class="text-primary">📈</span>
			Commit Activity Over Time
		</h3>

		<div class="mt-4 h-64">
			{#if chart_data.length > 0}
				<Chart
					data={chart_data}
					x="date"
					xScale={scaleTime()}
					y="count"
					yScale={scaleLinear()}
					yDomain={[0, null]}
					yNice
					padding={{ left: 40, bottom: 24, top: 8, right: 8 }}
					tooltip={{ mode: 'bisect-x' }}
				>
					<Svg>
						<Axis placement="left" grid rule />
						<Axis placement="bottom" format={(d) => format_date(d)} />
						<Area
							class={area_fill}
							line={{ class: 'stroke-primary stroke-2' }}
						/>
						<Highlight points lines />
					</Svg>
					<Tooltip.Root>
						{#snippet children({
							data,
						}: {
							data: { date: Date; count: number };
						})}
							<Tooltip.Header>{format_date(data.date)}</Tooltip.Header
							>
							<Tooltip.Item label="Commits" value={data.count} />
						{/snippet}
					</Tooltip.Root>
				</Chart>
			{:else}
				<div
					class="flex h-full items-center justify-center text-base-content/60"
				>
					No commit data available
				</div>
			{/if}
		</div>
	</div>
</div>
