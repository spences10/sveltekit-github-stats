<script lang="ts">
	import type { github_stats_result } from '$lib/github.remote';
	import { BarChart, Calendar, Code, InfoCircle } from '$lib/icons';

	let { stats } = $props<{ stats: github_stats_result }>();

	const summary_stats = $derived(() => {
		const total_repos = stats.repositories.length;
		const avg_commits_per_repo =
			total_repos > 0
				? Math.round(stats.total_commits / total_repos)
				: 0;
		const most_active_repo = stats.repositories[0];
		const date_range_days =
			Math.ceil(
				(new Date(stats.until).getTime() -
					new Date(stats.since).getTime()) /
					(1000 * 60 * 60 * 24),
			) + 1; // Add 1 to include both start and end dates
		const avg_commits_per_day =
			date_range_days > 0
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
</script>

<div class="stats mb-6 w-full bg-base-100 shadow-xl">
	<!-- Total Commits -->
	<div class="stat">
		<div class="stat-figure text-primary">
			<InfoCircle class_names="h-8 w-8" />
		</div>
		<div class="stat-title">Total Commits</div>
		<div class="stat-value text-primary">{stats.total_commits}</div>
		<div class="stat-desc">
			{summary_stats().avg_commits_per_day} commits/day average
		</div>
	</div>

	<!-- Total Repositories -->
	<div class="stat">
		<div class="stat-figure text-secondary">
			<Code class_names="h-8 w-8" />
		</div>
		<div class="stat-title">Repositories</div>
		<div class="stat-value text-secondary">
			{summary_stats().total_repos}
		</div>
		<div class="stat-desc">
			{summary_stats().avg_commits_per_repo} commits/repo average
		</div>
	</div>

	<!-- Most Active Repository -->
	<div class="stat">
		<div class="stat-figure text-accent">
			<BarChart class_names="h-8 w-8" />
		</div>
		<div class="stat-title">Most Active</div>
		<div class="stat-value text-sm text-accent">
			{summary_stats().most_active_repo?.name.split('/').pop() ||
				'N/A'}
		</div>
		<div class="stat-desc">
			{summary_stats().most_active_repo?.commits || 0} commits
		</div>
	</div>

	<!-- Date Range -->
	<div class="stat">
		<div class="stat-figure text-info">
			<Calendar class_names="h-8 w-8" />
		</div>
		<div class="stat-title">Time Period</div>
		<div class="stat-value text-info">
			{summary_stats().date_range_days}
		</div>
		<div class="stat-desc">
			{summary_stats().date_range_days === 1 ? 'day' : 'days'}
		</div>
	</div>
</div>
