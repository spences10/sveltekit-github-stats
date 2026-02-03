<script lang="ts">
	import { browser } from '$app/environment';
	import {
		ActivityHeatmap,
		ActivityLineChart,
		AdvancedOptions,
		CommitDistributionChart,
		FormInput,
		LoadingSkeleton,
		QuickDateOptions,
		RepositoryContributionChart,
		StatsOverview,
	} from '$lib/components';
	import { get_github_stats } from '$lib/github.remote';
	import { AlertCircle, AlertTriangle, Rocket } from '$lib/icons';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	let username = $state('');
	let date_option = $state(data.initial_date_option);
	let year = $state(new Date().getFullYear().toString());
	let since = $state(data.initial_date || '');
	let until = $state(data.initial_date || '');
	let query_params = $state<{
		username: string;
		since: string;
		until: string;
		timestamp: number;
	} | null>(null);

	// Create the query object when we have params
	const github_query = $derived(
		query_params ? get_github_stats(query_params) : null,
	);

	const calculate_dates = () => {
		let calculated_since: string, calculated_until: string;

		if (date_option === 'today') {
			const today = new Date().toISOString().split('T')[0];
			calculated_since = today;
			calculated_until = today;
		} else if (date_option === 'yesterday') {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterday_iso = yesterday.toISOString().split('T')[0];
			calculated_since = yesterday_iso;
			calculated_until = yesterday_iso;
		} else if (date_option === 'this_week') {
			const today = new Date();
			const day_of_week = today.getDay();
			const days_since_monday =
				day_of_week === 0 ? 6 : day_of_week - 1; // Sunday = 0, so 6 days since Monday

			const start_of_week = new Date(today);
			start_of_week.setDate(today.getDate() - days_since_monday); // Monday
			const end_of_week = new Date(start_of_week);
			end_of_week.setDate(start_of_week.getDate() + 6); // Sunday
			calculated_since = start_of_week.toISOString().split('T')[0];
			calculated_until = end_of_week.toISOString().split('T')[0];
		} else if (date_option === 'this_month') {
			const today = new Date();
			const start_of_month = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const end_of_month = new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				0,
			);
			calculated_since = start_of_month.toISOString().split('T')[0];
			calculated_until = end_of_month.toISOString().split('T')[0];
		} else if (date_option === 'this_year') {
			const today = new Date();
			const start_of_year = new Date(today.getFullYear(), 0, 1);
			const end_of_year = new Date(today.getFullYear(), 11, 31);
			calculated_since = start_of_year.toISOString().split('T')[0];
			calculated_until = end_of_year.toISOString().split('T')[0];
		} else if (date_option === 'year') {
			calculated_since = `${year}-01-01`;
			calculated_until = `${year}-12-31`;
		} else {
			calculated_since = since;
			calculated_until = until;
		}

		return { calculated_since, calculated_until };
	};

	const fetch_contributions = () => {
		if (!username.trim()) return;

		// Save username to localStorage for future visits
		if (browser) {
			localStorage.setItem('github_username', username.trim());
		}

		const { calculated_since, calculated_until } = calculate_dates();
		query_params = {
			username: username.trim(),
			since: calculated_since,
			until: calculated_until,
			timestamp: Date.now(),
		};
	};

	const handle_quick_date_select = (
		option:
			| 'today'
			| 'yesterday'
			| 'this_week'
			| 'this_month'
			| 'this_year',
	) => {
		date_option = option;
		fetch_contributions();
	};

	const handle_submit = (event: Event) => {
		event.preventDefault();
		fetch_contributions();
	};

	// Load saved username on mount
	onMount(() => {
		if (browser) {
			const saved_username = localStorage.getItem('github_username');
			if (saved_username) {
				username = saved_username;
			}
		}
	});
</script>

<form class="w-full" onsubmit={handle_submit}>
	<fieldset class="fieldset">
		<legend class="fieldset-legend">GitHub Username</legend>
		<FormInput
			id="username"
			name="username"
			placeholder="Enter GitHub username"
			class="input input-lg mb-4 w-full rounded-box"
			bind:value={username}
			required
		/>
	</fieldset>

	<QuickDateOptions
		on_quick_date_select={handle_quick_date_select}
		bind:current_date_option={date_option}
	/>

	<AdvancedOptions bind:date_option bind:year bind:since bind:until />

	<button
		type="submit"
		class="btn mt-4 w-full rounded-box btn-lg btn-primary"
		disabled={github_query?.loading}
	>
		Fetch Contributions
	</button>
</form>

<svelte:boundary>
	{#if github_query}
		{#if github_query.error}
			<div class="mt-8">
				<div class="alert alert-error">
					<AlertCircle class_names="h-6 w-6 shrink-0" />
					<span>Error: {github_query.error.message}</span>
				</div>
			</div>
		{:else if github_query.loading}
			<LoadingSkeleton />
		{:else if github_query.current}
			<div class="mt-8 space-y-6">
				<!-- Header -->
				<div class="text-center">
					<h2 class="mb-2 text-3xl font-bold">
						📊 GitHub Stats for
						<span class="text-primary"
							>{github_query.current.username}</span
						>
					</h2>
					<p class="text-base-content/60">
						{new Date(
							github_query.current.since,
						).toLocaleDateString()} -
						{new Date(
							github_query.current.until,
						).toLocaleDateString()}
					</p>
				</div>

				{#if github_query.current.reached_limit}
					<div class="alert alert-warning">
						<AlertTriangle class_names="h-6 w-6 shrink-0" />
						<span>{github_query.current.note}</span>
					</div>
				{/if}

				<!-- Stats Overview -->
				<StatsOverview stats={github_query.current} />

				<!-- Activity Charts -->
				{#if github_query.current.daily_commits.length > 0}
					<div class="grid grid-cols-1 gap-6">
						<ActivityLineChart
							daily_commits={github_query.current.daily_commits}
						/>
						<ActivityHeatmap
							daily_commits={github_query.current.daily_commits}
						/>
					</div>
				{/if}

				<!-- Charts Grid -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<RepositoryContributionChart stats={github_query.current} />
					<CommitDistributionChart stats={github_query.current} />
				</div>
			</div>
		{/if}
	{:else}
		<div class="mt-8 py-12 text-center">
			<div class="mb-4">
				<Rocket class_names="h-16 w-16 mx-auto text-primary" />
			</div>
			<h2 class="mb-2 text-2xl font-bold">
				Ready to Explore GitHub Stats?
			</h2>
			<p class="text-base-content/60">
				Enter a GitHub username above to view detailed contribution
				analytics and visualizations.
			</p>
		</div>
	{/if}

	{#snippet pending()}
		<div class="mt-8 flex items-center justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{/snippet}
</svelte:boundary>
