<script lang="ts">
	import {
		AdvancedOptions,
		CommitHeatmap,
		DailyActivityChart,
		FormInput,
		HourDistributionChart,
		LoadingSkeleton,
		QuickDateOptions,
		RepositoryDistributionChart,
		StatsOverview,
	} from '#lib/components/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		get_date_range,
		type QuickDateOption,
	} from '#lib/date-ranges.js';
	import { AlertCircle, AlertTriangle } from '#lib/icons/index.js';
	import type { github_stats_response } from '#lib/server/github-stats-cache.js';
	import { browser } from '$app/env';
	import { onMount, untrack } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import type { PageData } from './$types';

	type StatsPair = {
		primary: github_stats_response;
		comparison: github_stats_response | null;
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

	const calculate_dates = () =>
		get_date_range(date_option, new SvelteDate(), year, since, until);

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
		return (await response.json()) as github_stats_response;
	};

	const fetch_contributions = async () => {
		const trimmed_username = username.trim();
		const trimmed_comparison = comparison_username.trim();
		if (!trimmed_username || github_query?.loading) return;

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

	const handle_quick_date_select = (option: QuickDateOption) => {
		if (github_query?.loading) return;
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

<section
	class="grid gap-10 pb-10 lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-16 lg:pb-14"
>
	<div>
		<p
			class="mb-5 flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase"
		>
			<span class="size-2 rounded-full bg-primary"></span> Public GitHub
			commit stats
		</p>
		<h1
			class="max-w-[20ch] text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
		>
			Check your<br />GitHub commits.
		</h1>
		<p
			class="mt-6 max-w-[48ch] text-base/7 text-pretty text-muted-foreground sm:text-lg/8"
		>
			See how many public commits you’ve made today, without digging
			through your GitHub profile. Enter your handle to check your
			count.
		</p>
	</div>
	<div
		class="relative min-w-0 border-y border-border py-6 max-lg:hidden lg:py-8"
		aria-hidden="true"
	>
		<div
			class="mb-6 flex justify-between font-mono text-xs text-muted-foreground"
		>
			<span>PUBLIC COMMIT ACTIVITY</span><span>↗</span>
		</div>
		<div class="grid grid-flow-col grid-rows-7 gap-1.5">
			{#each Array.from({ length: 126 }, (_, i) => i) as cell (cell)}
				<span
					class={[
						'aspect-square rounded-xs',
						[
							'bg-primary/8',
							'bg-primary/20',
							'bg-primary/40',
							'bg-primary/65',
							'bg-primary',
						][((cell * 13 + Math.floor(cell / 7) * 7) % 17) % 5],
					]}
				></span>
			{/each}
		</div>
		<div
			class="mt-5 flex items-center justify-between font-mono text-xs text-muted-foreground"
		>
			<span>Illustration · not live data</span><span
				class="flex gap-1"
				><span class="size-2.5 bg-primary/15"></span><span
					class="size-2.5 bg-primary/40"
				></span><span class="size-2.5 bg-primary/70"></span><span
					class="size-2.5 bg-primary"
				></span></span
			>
		</div>
	</div>
</section>

<section
	aria-labelledby="explore-heading"
	class="overflow-hidden rounded-xl border bg-card"
>
	<div class="grid lg:grid-cols-[1fr_3fr]">
		<div
			class="border-b bg-muted/40 p-6 sm:p-8 lg:border-r lg:border-b-0"
		>
			<p
				class="font-mono text-xs tracking-wide text-primary uppercase"
			>
				01 / Explore
			</p>
			<h2
				id="explore-heading"
				class="mt-4 text-2xl font-medium tracking-tight text-balance"
			>
				Start with<br class="max-lg:hidden" /> a handle.
			</h2>
			<p
				class="mt-3 max-w-[28ch] text-base/6 text-pretty text-muted-foreground max-sm:hidden sm:text-sm/6"
			>
				Enter one or two GitHub handles and choose a date range to
				view their public commit counts.
			</p>
			<p
				class="mt-6 flex items-center gap-2 font-mono text-xs text-muted-foreground max-sm:hidden"
			>
				<span class="size-1.5 rounded-full bg-primary"></span>No
				sign-in required
			</p>
		</div>
		<form class="grid gap-6 p-6 sm:p-8" onsubmit={handle_submit}>
			<div class="grid gap-5 sm:grid-cols-2">
				<FormInput
					id="username"
					name="username"
					label="GitHub handle"
					placeholder="e.g. spences10"
					class="h-12 bg-background font-mono text-base shadow-none"
					bind:value={username}
					required
				/>
				<FormInput
					id="comparison_username"
					name="comparison_username"
					label="Compare with"
					placeholder="Second handle (optional)"
					class="h-12 bg-background font-mono text-base shadow-none"
					bind:value={comparison_username}
				/>
			</div>
			<QuickDateOptions
				disabled={github_query?.loading ?? false}
				on_quick_date_select={handle_quick_date_select}
				bind:current_date_option={date_option}
			/>
			<AdvancedOptions
				bind:date_option
				bind:year
				bind:since
				bind:until
			/>
			<div
				class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<p class="text-base text-muted-foreground sm:text-xs">
					Public commits. Handles saved on this device.
				</p>
				<Button
					type="submit"
					size="lg"
					class="h-12 gap-6 rounded-md px-6 text-base sm:text-sm"
					disabled={github_query?.loading}
					>{github_query?.loading ? 'Loading…' : 'Show stats'}<span
						aria-hidden="true">↗</span
					></Button
				>
			</div>
		</form>
	</div>
</section>

<div
	class="mt-10 min-w-0"
	aria-live="polite"
	aria-busy={github_query?.loading ?? false}
>
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
			<div class="reveal-up grid gap-6">
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
				{#if github_query.current.primary.since !== github_query.current.primary.until}
					{#if (new SvelteDate(github_query.current.primary.until).getTime() - new SvelteDate(github_query.current.primary.since).getTime()) / 86400000 >= 7}
						<CommitHeatmap
							stats={github_query.current.primary}
							comparison_stats={github_query.current.comparison}
						/>
					{/if}
					<DailyActivityChart
						stats={github_query.current.primary}
						comparison_stats={github_query.current.comparison}
					/>
				{/if}
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
		<section
			aria-label="What you can explore"
			class="grid gap-8 py-3 md:grid-cols-3 md:gap-10"
		>
			{#each [['01', 'Counts by date and hour', 'See daily commit totals and how commits are distributed across UTC hours.'], ['02', 'Counts by repository', 'See how many public commits were made to each repository in your selected range.'], ['03', 'Compare two handles', 'View public commit counts for two GitHub users over the same date range.']] as [number, title, description] (number)}
				<div class="border-t pt-5">
					<p class="mb-4 font-mono text-xs text-primary">/{number}</p>
					<h3 class="text-base font-medium text-balance">{title}</h3>
					<p
						class="mt-2 max-w-[40ch] text-base/7 text-pretty text-muted-foreground sm:text-sm/6"
					>
						{description}
					</p>
				</div>
			{/each}
		</section>
	{/if}
</div>
