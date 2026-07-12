<script lang="ts">
	import { browser } from '$app/environment';
	import {
		AdvancedOptions,
		DailyActivityChart,
		FormInput,
		HourDistributionChart,
		LoadingSkeleton,
		QuickDateOptions,
		RepositoryDistributionChart,
		StatsOverview,
	} from '$lib/components';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { AlertCircle, AlertTriangle } from '$lib/icons';
	import type { github_stats_result } from '$lib/server/github-stats';
	import { onMount, untrack } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import type { PageData } from './$types';

	type StatsPair = {
		primary: github_stats_result;
		comparison: github_stats_result | null;
	};

	let { data } = $props<{ data: PageData }>();

	const { initial_date, initial_date_option } = untrack(() => ({
		initial_date: data.initial_date || '',
		initial_date_option: data.initial_date_option,
	}));

	let username = $state('');
	let comparison_username = $state('');
	let date_option = $state(initial_date_option);
	let year = $state(new SvelteDate().getFullYear().toString());
	let since = $state(initial_date);
	let until = $state(initial_date);
	let comparison_error = $state<Error | null>(null);
	let github_query = $state<{
		loading: boolean;
		error: Error | null;
		current: StatsPair | null;
	} | null>(null);

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

	const request_stats = async (
		handle: string,
		calculated_since: string,
		calculated_until: string,
	) => {
		const params = new URLSearchParams({
			username: handle,
			since: calculated_since,
			until: calculated_until,
		});
		const response = await fetch(`/api/github-stats?${params}`);
		if (!response.ok) throw new Error(await response.text());
		return (await response.json()) as github_stats_result;
	};

	const fetch_contributions = async () => {
		const trimmed_username = username.trim();
		const trimmed_comparison = comparison_username.trim();
		if (!trimmed_username) return;

		if (browser) {
			localStorage.setItem('github_username', trimmed_username);
			if (trimmed_comparison) {
				localStorage.setItem(
					'github_comparison_username',
					trimmed_comparison,
				);
			} else {
				localStorage.removeItem('github_comparison_username');
			}
		}

		const { calculated_since, calculated_until } = calculate_dates();
		comparison_error = null;
		github_query = { loading: true, error: null, current: null };

		const primary_request = request_stats(
			trimmed_username,
			calculated_since,
			calculated_until,
		);
		const comparison_request = trimmed_comparison
			? request_stats(
					trimmed_comparison,
					calculated_since,
					calculated_until,
				)
			: Promise.resolve(null);

		const [primary_result, comparison_result] =
			await Promise.allSettled([primary_request, comparison_request]);

		if (primary_result.status === 'rejected') {
			github_query = {
				loading: false,
				error:
					primary_result.reason instanceof Error
						? primary_result.reason
						: new Error('Failed to fetch commits'),
				current: null,
			};
			return;
		}

		if (comparison_result.status === 'rejected') {
			comparison_error =
				comparison_result.reason instanceof Error
					? comparison_result.reason
					: new Error('Failed to fetch comparison');
		}

		github_query = {
			loading: false,
			error: null,
			current: {
				primary: primary_result.value,
				comparison:
					comparison_result.status === 'fulfilled'
						? comparison_result.value
						: null,
			},
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
		username = localStorage.getItem('github_username') ?? '';
		comparison_username =
			localStorage.getItem('github_comparison_username') ?? '';
	});
</script>

<section>
	<header class="max-w-2xl">
		<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">
			SvelteKit GitHub Stats
		</h1>
		<p class="mt-4 text-lg leading-8 text-muted-foreground">
			See public commit activity for one GitHub user, or put two
			handles side by side.
		</p>
	</header>

	<form class="panel mt-8 overflow-hidden" onsubmit={handle_submit}>
		<div
			class="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto_1fr] lg:items-end"
		>
			<FormInput
				id="username"
				name="username"
				label="GitHub handle"
				placeholder="scottspence"
				class="h-11 text-base"
				bind:value={username}
				required
			/>
			<span
				class="hidden pb-3 text-xs font-semibold text-muted-foreground uppercase lg:block"
			>
				vs
			</span>
			<FormInput
				id="comparison_username"
				name="comparison_username"
				label="Compare with"
				placeholder="Optional second handle"
				class="h-11 text-base"
				bind:value={comparison_username}
			/>
		</div>

		<div class="grid gap-5 border-t bg-muted/25 p-5 sm:p-6">
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

			<div class="flex justify-end">
				<Button
					type="submit"
					size="lg"
					class="h-11 min-w-36 px-5"
					disabled={github_query?.loading}
				>
					{github_query?.loading ? 'Loading…' : 'Show stats'}
				</Button>
			</div>
		</div>
	</form>
</section>

<div class="mt-10 min-w-0">
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
			<div class="grid gap-6 reveal-up">
				{#if comparison_error}
					<Alert.Root variant="destructive">
						<AlertCircle class_names="h-5 w-5" />
						<Alert.Title>Couldn’t load the comparison</Alert.Title>
						<Alert.Description
							>{comparison_error.message}</Alert.Description
						>
					</Alert.Root>
				{/if}

				{#if github_query.current.primary.reached_limit || github_query.current.comparison?.reached_limit}
					<Alert.Root>
						<AlertTriangle class_names="h-5 w-5" />
						<Alert.Title
							>GitHub’s 1,000-result limit applies</Alert.Title
						>
						<Alert.Description>
							Large ranges may show partial totals and repository
							data.
						</Alert.Description>
					</Alert.Root>
				{/if}

				<StatsOverview
					stats={github_query.current.primary}
					comparison_stats={github_query.current.comparison}
				/>
				<DailyActivityChart
					stats={github_query.current.primary}
					comparison_stats={github_query.current.comparison}
				/>
				<div class="grid gap-6 xl:grid-cols-2">
					<RepositoryDistributionChart
						stats={github_query.current.primary}
						comparison_stats={github_query.current.comparison}
					/>
					<HourDistributionChart
						stats={github_query.current.primary}
						comparison_stats={github_query.current.comparison}
					/>
				</div>
			</div>
		{/if}
	{:else}
		<section class="mt-10 border-t py-8">
			<h2 class="text-sm font-medium">Start with a GitHub handle.</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				The comparison handle is optional, and both are saved on this
				device.
			</p>
		</section>
	{/if}
</div>
