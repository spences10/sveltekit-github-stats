<script lang="ts">
	import type { github_stats_result } from '#lib/server/github-stats.js';

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

<section class="overflow-hidden rounded-xl border bg-card">
	<header class="panel-header items-center">
		<div>
			<p class="section-kicker">02 / The overview</p>
			<h2 class="mt-2 text-lg font-medium text-balance">
				{format_date(stats.since)}–{format_date(stats.until)}
			</h2>
		</div>
		{#if comparison_stats}
			<p
				class="rounded-md bg-muted px-3 py-2 text-base text-muted-foreground sm:text-sm"
			>
				<span class="font-medium text-foreground"
					>{Math.abs(difference).toLocaleString()}</span
				>
				commit{Math.abs(difference) === 1 ? '' : 's'} apart
			</p>
		{/if}
	</header>
	{#each [stats, ...(comparison_stats ? [comparison_stats] : [])] as result, index (index)}
		<div class="@container border-t first-of-type:border-t-0">
			<div
				class="grid gap-6 p-6 sm:p-8 @xl:grid-cols-[1fr_2fr] @xl:items-center"
			>
				<p
					class="flex min-w-0 items-center gap-2 font-mono text-base sm:text-sm"
				>
					<span
						class={[
							'size-2 shrink-0 rounded-full',
							index === 0 ? 'bg-chart-1' : 'bg-chart-2',
						]}
					></span><span class="truncate">@{result.username}</span>
				</p>
				<dl class="grid grid-cols-[3fr_2fr_2fr] gap-4">
					<div>
						<dt class="truncate text-sm text-muted-foreground">
							Public commits
						</dt>
						<dd
							class="mt-2 text-4xl font-medium tracking-tight tabular-nums @xl:text-5xl"
						>
							{result.total_commits.toLocaleString()}
						</dd>
					</div>
					<div>
						<dt class="truncate text-sm text-muted-foreground">
							Repositories
						</dt>
						<dd
							class="mt-2 text-4xl font-medium tracking-tight tabular-nums @xl:text-5xl"
						>
							{result.repositories.length.toLocaleString()}
						</dd>
					</div>
					<div>
						<dt class="truncate text-sm text-muted-foreground">
							Per day
						</dt>
						<dd
							class="mt-2 text-4xl font-medium tracking-tight tabular-nums @xl:text-5xl"
						>
							{get_daily_average(result)}
						</dd>
					</div>
				</dl>
			</div>
		</div>
	{/each}
	{#if stats.total_commits === 0}
		<p
			class="border-t px-6 py-4 text-base text-muted-foreground sm:px-8 sm:text-sm"
		>
			No public commits found for @{stats.username} in this range. Try a
			wider time frame.
		</p>
	{/if}
</section>
