<script lang="ts">
	import { browser } from '$app/environment';
	import {
		AdvancedOptions,
		CommitDistributionChart,
		FormInput,
		HourDistributionChart,
		LoadingSkeleton,
		QuickDateOptions,
		RepositoryContributionChart,
		StatsOverview,
	} from '$lib/components';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { get_github_stats } from '$lib/github.remote';
	import { AlertCircle, AlertTriangle, Rocket } from '$lib/icons';
	import { onMount, untrack } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const { initial_date, initial_date_option } = untrack(() => ({
		initial_date: data.initial_date || '',
		initial_date_option: data.initial_date_option,
	}));

	let username = $state('');
	let date_option = $state(initial_date_option);
	let year = $state(new SvelteDate().getFullYear().toString());
	let since = $state(initial_date);
	let until = $state(initial_date);
	let query_params = $state<{
		username: string;
		since: string;
		until: string;
		timestamp: number;
	} | null>(null);

	const github_query = $derived(
		query_params ? get_github_stats(query_params) : null,
	);

	const calculate_dates = () => {
		let calculated_since: string;
		let calculated_until: string;

		if (date_option === 'today') {
			const today = new SvelteDate().toISOString().split('T')[0];
			calculated_since = today;
			calculated_until = today;
		} else if (date_option === 'yesterday') {
			const yesterday = new SvelteDate();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterday_iso = yesterday.toISOString().split('T')[0];
			calculated_since = yesterday_iso;
			calculated_until = yesterday_iso;
		} else if (date_option === 'this_week') {
			const today = new SvelteDate();
			const day_of_week = today.getDay();
			const days_since_monday =
				day_of_week === 0 ? 6 : day_of_week - 1;
			const start_of_week = new SvelteDate(today);
			start_of_week.setDate(today.getDate() - days_since_monday);
			const end_of_week = new SvelteDate(start_of_week);
			end_of_week.setDate(start_of_week.getDate() + 6);
			calculated_since = start_of_week.toISOString().split('T')[0];
			calculated_until = end_of_week.toISOString().split('T')[0];
		} else if (date_option === 'this_month') {
			const today = new SvelteDate();
			calculated_since = new SvelteDate(
				today.getFullYear(),
				today.getMonth(),
				1,
			)
				.toISOString()
				.split('T')[0];
			calculated_until = new SvelteDate(
				today.getFullYear(),
				today.getMonth() + 1,
				0,
			)
				.toISOString()
				.split('T')[0];
		} else if (date_option === 'this_year') {
			const today = new SvelteDate();
			calculated_since = new SvelteDate(today.getFullYear(), 0, 1)
				.toISOString()
				.split('T')[0];
			calculated_until = new SvelteDate(today.getFullYear(), 11, 31)
				.toISOString()
				.split('T')[0];
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
		const trimmed_username = username.trim();
		if (!trimmed_username) return;

		if (browser) {
			localStorage.setItem('github_username', trimmed_username);
		}

		const { calculated_since, calculated_until } = calculate_dates();
		query_params = {
			username: trimmed_username,
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

	onMount(() => {
		const saved_username = localStorage.getItem('github_username');
		if (saved_username) {
			username = saved_username;
		}
	});
</script>

<section class="space-y-8">
	<div
		class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,500px)] lg:items-start"
	>
		<div class="max-w-3xl">
			<Badge variant="secondary" class="mb-4"
				>Public commit analytics</Badge
			>
			<h1
				class="title-font text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
			>
				Explore public GitHub commit activity.
			</h1>
			<p
				class="mt-5 max-w-[62ch] text-lg text-pretty text-muted-foreground"
			>
				Search a username, choose a date range, and summarize public
				commits by repository, volume, and UTC hour.
			</p>
		</div>

		<Card.Root class="chart-panel">
			<Card.Header>
				<Card.Title>Search commits</Card.Title>
				<Card.Description>
					Use a GitHub username to look up public commits for the
					selected range.
				</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form class="grid gap-5" onsubmit={handle_submit}>
					<FormInput
						id="username"
						name="username"
						label="GitHub username"
						placeholder="sveltejs"
						class="h-11 text-base"
						bind:value={username}
						required
					/>

					<QuickDateOptions
						on_quick_date_select={handle_quick_date_select}
						bind:current_date_option={date_option}
					/>

					<AdvancedOptions
						bind:date_option
						bind:year
						bind:since
						bind:until
					/>

					<Button
						type="submit"
						size="lg"
						class="h-11 w-full"
						disabled={github_query?.loading}
					>
						{github_query?.loading ? 'Searching…' : 'Search commits'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>

	<svelte:boundary>
		<div class="min-w-0">
			{#if github_query}
				{#if github_query.error}
					<Alert.Root variant="destructive">
						<AlertCircle class_names="h-5 w-5" />
						<Alert.Title>Couldn’t fetch commits</Alert.Title>
						<Alert.Description
							>{github_query.error.message}</Alert.Description
						>
					</Alert.Root>
				{:else if github_query.loading}
					<LoadingSkeleton />
				{:else if github_query.current}
					<div class="grid gap-6">
						<div
							class="chart-panel reveal-up grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
						>
							<div class="min-w-0">
								<Badge variant="outline" class="mb-3">
									{new Date(
										github_query.current.since,
									).toLocaleDateString()} — {new Date(
										github_query.current.until,
									).toLocaleDateString()}
								</Badge>
								<h2
									class="title-font truncate text-3xl font-semibold tracking-tight sm:text-4xl"
								>
									{github_query.current.username}'s public commits
								</h2>
							</div>
							<p
								class="max-w-[42ch] text-sm text-pretty text-muted-foreground lg:text-right"
							>
								GitHub Search returns the first 1,000 matching commits
								for this range.
							</p>
						</div>

						{#if github_query.current.reached_limit}
							<Alert.Root>
								<AlertTriangle class_names="h-5 w-5" />
								<Alert.Title>GitHub search limit reached</Alert.Title>
								<Alert.Description
									>{github_query.current.note}</Alert.Description
								>
							</Alert.Root>
						{/if}

						<StatsOverview stats={github_query.current} />

						<div
							class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]"
						>
							<RepositoryContributionChart
								stats={github_query.current}
							/>
							<CommitDistributionChart stats={github_query.current} />
						</div>

						<HourDistributionChart stats={github_query.current} />
					</div>
				{/if}
			{:else}
				<Card.Root class="chart-panel min-h-[420px] border-dashed">
					<Card.Content
						class="flex h-full min-h-[420px] flex-col items-center justify-center p-10 text-center"
					>
						<div
							class="mb-6 rounded-3xl bg-primary/10 p-5 text-primary"
						>
							<Rocket class_names="h-12 w-12" />
						</div>
						<h2
							class="title-font max-w-lg text-3xl font-semibold tracking-tight text-balance"
						>
							Start with a GitHub username.
						</h2>
						<p
							class="mt-3 max-w-md text-pretty text-muted-foreground"
						>
							Choose a GitHub handle and date range to see public
							commit totals, repository activity, and UTC timing.
						</p>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>

		{#snippet pending()}
			<LoadingSkeleton />
		{/snippet}
	</svelte:boundary>
</section>
