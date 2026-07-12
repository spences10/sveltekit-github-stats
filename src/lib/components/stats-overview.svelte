<script lang="ts">
	import type { github_stats_result } from '$lib/server/github-stats';

	let { stats, comparison_stats = null } = $props<{
		stats: github_stats_result;
		comparison_stats?: github_stats_result | null;
	}>();

	const format_date = (date: string) =>
		new Intl.DateTimeFormat('en', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		}).format(new Date(`${date}T12:00:00`));

	const get_daily_average = (result: github_stats_result) => {
		const days =
			Math.ceil(
				(new Date(result.until).getTime() -
					new Date(result.since).getTime()) /
					(1000 * 60 * 60 * 24),
			) + 1;
		return days ? (result.total_commits / days).toFixed(1) : '0';
	};

	const difference = $derived(
		comparison_stats
			? stats.total_commits - comparison_stats.total_commits
			: 0,
	);
</script>

<section class="panel overflow-hidden">
	<header class="panel-header items-center">
		<div>
			<p class="section-kicker">Results</p>
			<h2 class="mt-1 text-sm font-medium">
				{format_date(stats.since)}–{format_date(stats.until)}
			</h2>
		</div>
		{#if comparison_stats}
			<p class="text-sm text-muted-foreground">
				<span class="font-medium text-foreground">
					{Math.abs(difference).toLocaleString()}
				</span>
				commit{Math.abs(difference) === 1 ? '' : 's'} apart
			</p>
		{/if}
	</header>

	<div class={comparison_stats ? 'grid md:grid-cols-2' : 'grid'}>
		<div class="p-5 sm:p-6 md:border-r">
			<p class="flex items-center gap-2 text-sm font-medium">
				<span class="size-2 rounded-full bg-chart-1"></span>
				@{stats.username}
			</p>
			<p
				class="metric-number mt-4 text-5xl font-semibold tracking-tight sm:text-6xl"
			>
				{stats.total_commits.toLocaleString()}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">public commits</p>
			<div class="mt-6 flex gap-6 border-t pt-4 text-sm">
				<p>
					<span class="metric-number block font-semibold">
						{stats.repositories.length.toLocaleString()}
					</span>
					<span class="text-muted-foreground">repositories</span>
				</p>
				<p>
					<span class="metric-number block font-semibold">
						{get_daily_average(stats)}
					</span>
					<span class="text-muted-foreground">per day</span>
				</p>
			</div>
		</div>

		{#if comparison_stats}
			<div class="border-t p-5 sm:p-6 md:border-t-0">
				<p class="flex items-center gap-2 text-sm font-medium">
					<span class="size-2 rounded-full bg-chart-2"></span>
					@{comparison_stats.username}
				</p>
				<p
					class="metric-number mt-4 text-5xl font-semibold tracking-tight sm:text-6xl"
				>
					{comparison_stats.total_commits.toLocaleString()}
				</p>
				<p class="mt-1 text-sm text-muted-foreground">
					public commits
				</p>
				<div class="mt-6 flex gap-6 border-t pt-4 text-sm">
					<p>
						<span class="metric-number block font-semibold">
							{comparison_stats.repositories.length.toLocaleString()}
						</span>
						<span class="text-muted-foreground">repositories</span>
					</p>
					<p>
						<span class="metric-number block font-semibold">
							{get_daily_average(comparison_stats)}
						</span>
						<span class="text-muted-foreground">per day</span>
					</p>
				</div>
			</div>
		{/if}
	</div>
</section>
