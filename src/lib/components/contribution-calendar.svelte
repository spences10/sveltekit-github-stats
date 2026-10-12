<script lang="ts">
	import {
		get_contribution_range,
		request_contributions,
	} from '#lib/contributions.js';
	import type { github_contributions_result } from '#lib/server/github-contributions.js';
	import CalendarLegend from './calendar-legend.svelte';
	import CommitSkyline from './commit-skyline.svelte';
	import DailyCountsTable from './daily-counts-table.svelte';

	let { usernames }: { usernames: string[] } = $props();

	type Loaded = {
		username: string;
		result: github_contributions_result | null;
		error: string | null;
	};

	// The last year, or one calendar year
	let period = $state('last_year');
	let loaded = $state.raw<Loaded[]>([]);
	let loading = $state(true);

	const load = async (
		username: string,
		range: { since: string; until: string },
	): Promise<Loaded> => {
		try {
			return {
				username,
				result: await request_contributions(username, range),
				error: null,
			};
		} catch (error) {
			return {
				username,
				result: null,
				error:
					error instanceof Error
						? error.message
						: 'Failed to fetch contributions',
			};
		}
	};

	$effect(() => {
		const range = get_contribution_range(period);
		const handles = usernames;
		let cancelled = false;
		loading = true;
		// The previous calendar stays up until the next one arrives
		Promise.all(
			handles.map((username) => load(username, range)),
		).then((next) => {
			if (cancelled) return;
			loaded = next;
			loading = false;
		});
		return () => {
			cancelled = true;
		};
	});

	// GitHub's calendar dates are laid out as local calendar dates, so
	// they do not shift in the viewer's timezone.
	const calendar_date = (date: string) => {
		const [year, month, day] = date.split('-').map(Number);
		return new Date(year, month - 1, day);
	};
	const datasets = $derived(
		loaded.map((item) => ({
			...item,
			days: (item.result?.daily_contributions ?? []).map((day) => ({
				date: calendar_date(day.date),
				key: day.date,
				count: day.count,
			})),
		})),
	);
	const years = $derived(
		loaded.find((item) => item.result)?.result?.years ?? [],
	);
	const counts = $derived(
		datasets
			.flatMap((dataset) => dataset.days.map((day) => day.count))
			.filter((count) => count > 0)
			.sort((a, b) => a - b),
	);
	const maximum = $derived(Math.max(1, counts.at(-1) ?? 1));
	// As on GitHub, the busiest days are picked out by quartile, so one
	// exceptional day does not wash out the rest
	const thresholds = $derived(
		[
			...new Set([
				1,
				...[0.25, 0.5, 0.75].map(
					(share) => counts[Math.floor(share * counts.length)] ?? 1,
				),
			]),
		].sort((a, b) => a - b),
	);
	const colors = $derived([
		'var(--muted)',
		...thresholds.map(
			(_, index) =>
				`color-mix(in oklch, var(--chart-1) ${Math.round(((index + 1) / thresholds.length) * 100)}%, var(--card))`,
		),
	]);

	const period_label = $derived(
		period === 'last_year' ? 'the last year' : period,
	);
</script>

<section
	class="panel min-w-0 overflow-hidden"
	aria-label="Contribution calendar"
>
	<header class="panel-header">
		<div>
			<p class="section-kicker">Contribution calendar</p>
			<h3 class="mt-1 font-semibold text-balance">
				Contributions in {period_label}
			</h3>
			<p class="mt-2 text-base text-muted-foreground sm:text-sm">
				Commits, pull requests, issues and reviews per day, as on a
				GitHub profile.
			</p>
		</div>
		<label class="flex items-center gap-2 text-sm">
			<span class="text-muted-foreground">Period</span>
			<select
				class="h-9 rounded-md border-input bg-background py-0 pr-8 pl-3 text-sm"
				bind:value={period}
			>
				<option value="last_year">Last year</option>
				{#each years as year (year)}
					<option value={year.toString()}>{year}</option>
				{/each}
			</select>
		</label>
	</header>
	<div
		class={['transition-opacity', loading && 'opacity-60']}
		aria-busy={loading}
	>
		{#each datasets as dataset (dataset.username)}
			<div
				class="min-w-0 border-t p-5 first-of-type:border-t-0 sm:p-6"
			>
				{#if dataset.result}
					<CommitSkyline
						days={dataset.days}
						username={dataset.result.username}
						detail="{dataset.result.total_contributions.toLocaleString()} contributions"
						label="{dataset.result.username} contribution calendar"
						unit="Contributions"
						{maximum}
						{thresholds}
						{colors}
						start_flat
					/>
					<DailyCountsTable
						days={dataset.days}
						summary="View daily contributions"
						caption="Daily contribution counts for {dataset.result
							.username}"
						unit="Contributions"
					/>
				{:else}
					<p class="font-mono text-sm">@{dataset.username}</p>
					<p class="mt-2 text-sm text-destructive">{dataset.error}</p>
				{/if}
			</div>
		{:else}
			<p class="p-5 text-sm text-muted-foreground sm:p-6">
				Loading contributions…
			</p>
		{/each}
	</div>
	{#if counts.length}
		<CalendarLegend
			{thresholds}
			{colors}
			unit="contributions per day"
		/>
	{/if}
</section>
