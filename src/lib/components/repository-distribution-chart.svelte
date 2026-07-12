<script lang="ts">
	import type { github_stats_result } from '$lib/server/github-stats';
	import { PieChart } from 'layerchart';

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
</script>

<section class="panel min-w-0 overflow-hidden">
	<header class="panel-header">
		<div>
			<p class="section-kicker">Repository mix</p>
			<h3 class="mt-1 font-semibold">Where commits landed</h3>
		</div>
	</header>

	<div class={datasets.length > 1 ? 'grid md:grid-cols-2' : 'grid'}>
		{#each datasets as dataset, dataset_index (dataset.result.username)}
			<div
				class={[
					'p-5 sm:p-6',
					dataset_index > 0
						? 'border-t md:border-t-0 md:border-l'
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
				</p>

				{#if dataset.data.length}
					<div class="relative mx-auto mt-3 max-w-64">
						<PieChart
							data={dataset.data}
							key="key"
							value="value"
							cRange={dataset.data.map((item) => item.color)}
							innerRadius={-32}
							cornerRadius={3}
							padAngle={0.018}
							height={220}
						/>
						<div
							class="pointer-events-none absolute inset-0 grid place-content-center text-center"
						>
							<strong class="metric-number text-2xl">
								{dataset.result.repositories.length}
							</strong>
							<span class="text-xs text-muted-foreground">repos</span>
						</div>
					</div>

					<ul class="mt-3 grid gap-2 text-xs">
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
