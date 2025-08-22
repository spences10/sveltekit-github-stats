<script lang="ts">
	import { AdvancedOptions, FormInput } from '$lib/components';
	import { get_github_stats } from '$lib/github.remote';
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
		} else if (date_option === 'year') {
			calculated_since = `${year}-01-01`;
			calculated_until = `${year}-12-31`;
		} else {
			calculated_since = since;
			calculated_until = until;
		}

		return { calculated_since, calculated_until };
	};

	const handle_submit = (event: Event) => {
		event.preventDefault();
		if (!username.trim()) return;

		const { calculated_since, calculated_until } = calculate_dates();
		query_params = {
			username: username.trim(),
			since: calculated_since,
			until: calculated_until,
		};
	};
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
				<p class="text-error">Error: {github_query.error.message}</p>
			</div>
		{:else if github_query.loading}
			<div class="mt-8 flex items-center justify-center">
				<span class="loading loading-lg loading-spinner"></span>
			</div>
		{:else if github_query.current}
			<div class="prose prose-xl mt-8">
				<h2>Contributions for {github_query.current.username}</h2>
				<p>Total Commits: {github_query.current.total_commits}</p>
				<p>
					Date Range: {new Date(
						github_query.current.since,
					).toLocaleDateString()} - {new Date(
						github_query.current.until,
					).toLocaleDateString()}
				</p>

				{#if github_query.current.reached_limit}
					<p class="text-warning">{github_query.current.note}</p>
				{/if}

				<h3>Repositories Contributed To:</h3>
				<ul>
					{#each github_query.current.repositories as repo}
						<li>
							<a
								href={repo.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								{repo.name}
							</a>
							: {repo.commits} commit{repo.commits !== 1 ? 's' : ''}
							<br />
							<small>
								Last updated: {new Date(
									repo.last_updated,
								).toLocaleString()}
							</small>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{:else}
		<p class="mt-8">
			Enter a GitHub username and fetch contributions data.
		</p>
	{/if}

	{#snippet pending()}
		<div class="mt-8 flex items-center justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{/snippet}
</svelte:boundary>
