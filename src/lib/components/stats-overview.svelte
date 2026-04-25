<script lang="ts">
	import type { github_stats_result } from '$lib/github.remote';

	let { stats } = $props<{ stats: github_stats_result }>();

	const summary = $derived.by(() => {
		const total_repos = stats.repositories.length;
		const avg_commits_per_repo = total_repos
			? Math.round(stats.total_commits / total_repos)
			: 0;
		const most_active_repo = [...stats.repositories].sort(
			(a, b) => b.commits - a.commits,
		)[0];
		const date_range_days =
			Math.ceil(
				(new Date(stats.until).getTime() -
					new Date(stats.since).getTime()) /
					(1000 * 60 * 60 * 24),
			) + 1;
		const avg_commits_per_day = date_range_days
			? (stats.total_commits / date_range_days).toFixed(1)
			: '0';

		return {
			total_repos,
			avg_commits_per_repo,
			most_active_repo,
			date_range_days,
			avg_commits_per_day,
		};
	});

	const cards = $derived([
		{
			label: 'Commits',
			value: stats.total_commits.toLocaleString(),
			detail: `${summary.avg_commits_per_day} per day`,
		},
		{
			label: 'Active repos',
			value: summary.total_repos.toLocaleString(),
			detail: `${summary.avg_commits_per_repo} commits/repo`,
		},
		{
			label: 'Top repository',
			value: summary.most_active_repo?.name.split('/').pop() ?? 'N/A',
			detail: `${summary.most_active_repo?.commits ?? 0} commits`,
		},
		{
			label: 'Window',
			value: summary.date_range_days.toLocaleString(),
			detail: summary.date_range_days === 1 ? 'day' : 'days',
		},
	]);
</script>

<section class="chart-panel reveal-up @container p-5 sm:p-6">
	<div class="grid grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-4">
		{#each cards as card (card.label)}
			<div
				class="min-w-0 border-border/60 py-4 not-first:border-t first:pt-0 last:pb-0 @2xl:px-5 @2xl:py-0 @2xl:nth-2:border-t-0 @2xl:nth-[2n]:border-l @2xl:nth-[2n]:pl-5 @2xl:nth-[2n+1]:pr-5 @2xl:nth-[n+3]:mt-5 @2xl:nth-[n+3]:border-t @2xl:nth-[n+3]:pt-5 @5xl:mt-0 @5xl:border-t-0 @5xl:py-0 @5xl:not-first:border-l @5xl:not-first:pl-6 @5xl:not-last:pr-6 @5xl:first:pl-0 @5xl:last:pr-0"
			>
				<p class="truncate text-sm font-medium text-muted-foreground">
					{card.label}
				</p>
				<p
					class="metric-number mt-2 truncate text-3xl font-semibold tracking-tight sm:text-4xl"
					title={card.value}
				>
					{card.value}
				</p>
				<p class="mt-1 truncate text-sm text-muted-foreground">
					{card.detail}
				</p>
			</div>
		{/each}
	</div>
</section>
