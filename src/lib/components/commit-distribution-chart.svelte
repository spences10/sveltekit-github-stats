<script lang="ts">
	import type { github_stats_result } from '$lib/github.remote';
	import { Chevron } from '$lib/icons';

	let { stats } = $props<{ stats: github_stats_result }>();

	let sort_order: 'desc' | 'asc' = $state('desc'); // Default to highest first

	const pie_data = $derived(() => {
		const data = stats.repositories.map(
			(repo: { name: string; commits: number }, index: number) => ({
				label: repo.name.split('/').pop() || repo.name,
				value: repo.commits,
				percentage: (repo.commits / stats.total_commits) * 100,
				color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Golden angle for better color distribution
			}),
		);

		// Sort by commits based on sort_order
		return data.sort((a: { value: number }, b: { value: number }) =>
			sort_order === 'desc' ? b.value - a.value : a.value - b.value,
		);
	});

	const radius = 80;
	const center = 100;

	const get_path = (percentage: number, offset: number) => {
		const angle = (percentage / 100) * 2 * Math.PI;
		const start_angle = (offset / 100) * 2 * Math.PI - Math.PI / 2;
		const end_angle = start_angle + angle;

		const x1 = center + radius * Math.cos(start_angle);
		const y1 = center + radius * Math.sin(start_angle);
		const x2 = center + radius * Math.cos(end_angle);
		const y2 = center + radius * Math.sin(end_angle);

		const large_arc = angle > Math.PI ? 1 : 0;

		return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${large_arc} 1 ${x2} ${y2} Z`;
	};

	const toggle_sort = () => {
		sort_order = sort_order === 'desc' ? 'asc' : 'desc';
	};
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="flex items-center justify-between">
			<h3 class="card-title">
				<span class="text-primary">🥧</span>
				Commit Distribution
			</h3>
			<button
				class="btn btn-ghost btn-sm"
				onclick={toggle_sort}
				title={sort_order === 'desc'
					? 'Sort ascending'
					: 'Sort descending'}
			>
				<Chevron
					height="16px"
					width="16px"
					rotated={sort_order === 'desc'}
				/>
			</button>
		</div>

		<div class="mt-4 flex flex-col gap-6 lg:flex-row">
			<!-- Pie Chart -->
			<div class="flex justify-center">
				<svg viewBox="0 0 200 200" class="h-48 w-48">
					{#each pie_data() as segment, index}
						{@const offset = pie_data()
							.slice(0, index)
							.reduce(
								(sum: number, s: { percentage: number }) =>
									sum + s.percentage,
								0,
							)}
						<path
							d={get_path(segment.percentage, offset)}
							fill={segment.color}
							stroke="white"
							stroke-width="2"
							class="cursor-pointer transition-opacity hover:opacity-80"
						>
							<title
								>{segment.label}: {segment.value} commits ({segment.percentage.toFixed(
									1,
								)}%)</title
							>
						</path>
					{/each}

					<!-- Center text -->
					<text
						x={center}
						y={center - 10}
						text-anchor="middle"
						class="fill-base-content text-lg font-bold"
					>
						{stats.total_commits}
					</text>
					<text
						x={center}
						y={center + 10}
						text-anchor="middle"
						class="fill-base-content/60 text-sm"
					>
						commits
					</text>
				</svg>
			</div>

			<!-- Legend -->
			<div class="flex-1 space-y-2">
				{#each pie_data() as segment}
					<div class="flex items-center gap-3">
						<div
							class="h-4 w-4 flex-shrink-0 rounded-full"
							style="background-color: {segment.color}"
						></div>
						<div class="min-w-0 flex-1">
							<div
								class="truncate text-sm font-medium"
								title={segment.label}
							>
								{segment.label}
							</div>
							<div class="text-xs text-base-content/60">
								{segment.value} commits ({segment.percentage.toFixed(
									1,
								)}%)
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
