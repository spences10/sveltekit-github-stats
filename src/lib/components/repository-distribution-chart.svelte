<script lang="ts">
	import type { github_stats_result } from '#lib/server/github-stats.js';
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
		Tooltip,
	} from 'layerchart';
	import ChartViewControls from './chart-view-controls.svelte';
	import {
		create_isometric_view,
		tower_gradient,
	} from './isometric-view.svelte';

	let { stats, comparison_stats = null } = $props<{
		stats: github_stats_result;
		comparison_stats?: github_stats_result | null;
	}>();

	const colors = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
		'color-mix(in oklch, var(--muted-foreground) 55%, transparent)',
	];

	const datasets = $derived.by(() =>
		[stats, ...(comparison_stats ? [comparison_stats] : [])].map(
			(result) => {
				const sorted = [...result.repositories].sort(
					(a, b) => b.commits - a.commits,
				);
				const visible = sorted.slice(0, 5).map((repo, index) => ({
					key: repo.name,
					label: repo.name.split('/').pop() || repo.name,
					value: repo.commits,
					color: colors[index],
				}));
				const other_commits = sorted
					.slice(5)
					.reduce((total, repo) => total + repo.commits, 0);
				if (other_commits) {
					visible.push({
						key: 'other',
						label: 'Other',
						value: other_commits,
						color: colors[5],
					});
				}
				return { result, data: visible };
			},
		),
	);
	type RepositoryTower = (typeof datasets)[number]['data'][number];

	// One scale for every handle, so towers compare across the panel
	const max_value = $derived(
		Math.max(
			1,
			...datasets.flatMap((dataset) =>
				dataset.data.map((item) => item.value),
			),
		),
	);

	// Both handles turn together
	const view = create_isometric_view(() => ({
		rotate: -30,
		tilt: 62,
	}));

	// Each colour is drawn as a gradient of its own, down every face
	const uid = $props.id();
	const gradient_id = (index: number) => `${uid}-fill-${index}`;
</script>

<section class="panel @container min-w-0 overflow-hidden">
	<header class="panel-header">
		<div>
			<p class="section-kicker">Repository mix</p>
			<h3 class="mt-1 font-semibold">Where commits landed</h3>
		</div>
	</header>

	<div class="flex items-center gap-4 px-5 pt-4 sm:px-6">
		<p class="text-xs text-muted-foreground max-sm:hidden">
			Drag to turn
		</p>
		<div class="ml-auto">
			<ChartViewControls {view} label="repository chart" />
		</div>
	</div>

	<div class={datasets.length > 1 ? 'grid @lg:grid-cols-2' : 'grid'}>
		{#each datasets as dataset, dataset_index (dataset_index)}
			<div
				class={[
					'p-5 sm:p-6',
					dataset_index > 0
						? 'border-t @lg:border-t-0 @lg:border-l'
						: '',
				]}
			>
				<p class="flex items-center gap-2 text-sm font-medium">
					<span
						class={[
							'size-2 rounded-full',
							dataset_index === 0 ? 'bg-chart-1' : 'bg-chart-2',
						]}
					></span>
					@{dataset.result.username}
					<span class="ml-auto font-normal text-muted-foreground">
						<span class="metric-number"
							>{dataset.result.repositories.length}</span
						>
						{dataset.result.repositories.length === 1
							? 'repo'
							: 'repos'}
					</span>
				</p>

				{#if dataset.data.length}
					<div
						class="mt-3 h-64 cursor-grab touch-pan-y select-none active:cursor-grabbing"
					>
						<Chart
							data={dataset.data}
							x="key"
							xScale={scaleBand()
								.paddingInner(0.25)
								.paddingOuter(0.15)}
							xDomain={dataset.data.map((item) => item.key)}
							y={() => 'commits'}
							yScale={scaleBand().paddingOuter(0.2)}
							yDomain={['commits']}
							z="value"
							valueAxis="z"
							zDomain={[0, max_value]}
							zNice
							zRange={({ width }: { width: number }) => [
								0,
								width * 0.45,
							]}
							c="color"
							cScale={scaleOrdinal()}
							cDomain={colors}
							cRange={colors.map(
								(_, index) => `url(#${gradient_id(index)})`,
							)}
							view={isometric({
								...view.options,
								// Never a long thin strip, however few repositories
								aspect: Math.max(1.6, dataset.data.length / 2),
							})}
							transform={{ mode: 'canvas', drag: 'rotate' }}
							onTransform={view.on_transform}
							ondragstart={view.drag_start}
							ondragend={view.drag_end}
							tooltipContext={{ mode: 'manual' }}
							padding={{ top: 12, bottom: 12, left: 36, right: 12 }}
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
								<Frame
									class="fill-foreground/3 stroke-foreground/15"
								/>
								<Grid
									z
									classes={{ line: 'stroke-foreground opacity-15' }}
								/>
								<Axis
									placement="back"
									ticks={3}
									format="integer"
									classes={{
										tickLabel:
											'!stroke-transparent fill-muted-foreground text-[11px]',
									}}
								/>
								<Bars
									tooltip
									strokeWidth={1}
									stroke="var(--card)"
									class="repository-tower"
								/>
							</Svg>

							<Tooltip.Root>
								{#snippet children({
									data,
								}: {
									data: RepositoryTower;
								})}
									<Tooltip.Header>{data.label}</Tooltip.Header>
									<Tooltip.List>
										<Tooltip.Item
											label="Commits"
											value={data.value}
											color={data.color}
										/>
									</Tooltip.List>
								{/snippet}
							</Tooltip.Root>
						</Chart>
					</div>

					<ul class="mt-3 grid gap-3 text-base sm:text-sm">
						{#each dataset.data as item (item.key)}
							<li class="flex min-w-0 items-center gap-2">
								<span
									class="size-2 shrink-0 rounded-full"
									style:background-color={item.color}
								></span>
								<span class="truncate">{item.label}</span>
								<span
									class="metric-number ml-auto text-muted-foreground"
								>
									{item.value}
								</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="py-16 text-sm text-muted-foreground">
						No repositories in this range.
					</p>
				{/if}
			</div>
		{/each}
	</div>
</section>

<style>
	:global(.lc-rect-box:has(.repository-tower):hover .lc-rect) {
		filter: brightness(1.12);
	}
</style>
