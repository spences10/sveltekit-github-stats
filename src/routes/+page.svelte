<script lang="ts">
	import { enhance } from '$app/forms';
	import { AdvancedOptions, FormInput } from '$lib/components';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
	let username = $state(form?.username || '');
	let date_option = $state('today');
	let year = $state(new Date().getFullYear().toString());
	let since = $state('');
	let until = $state('');
	let loading = $state(false);

	$effect(() => {
		if (form?.username) {
			username = form.username;
		}
	});

	const handle_submit = (event: Event) => {
		const form = event.target as HTMLFormElement;
		if (date_option === 'today' || date_option === 'year') {
			form.since.value = since;
			form.until.value = until;
		}
	};
</script>

<form
	method="POST"
	class="w-full"
	onsubmit={handle_submit}
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			await update({ reset: false });
			loading = false;
		};
	}}
>
	<fieldset class="fieldset">
		<legend class="fieldset-legend">GitHub Username</legend>
		<FormInput
			id="username"
			name="username"
			placeholder="Enter GitHub username"
			class="input input-lg rounded-box mb-4 w-full"
			bind:value={username}
			required
		/>
	</fieldset>

	<AdvancedOptions bind:date_option bind:year bind:since bind:until />

	<button
		type="submit"
		class="btn btn-lg btn-primary rounded-box mt-4 w-full"
		disabled={loading}
	>
		{#if loading}
			<span class="loading loading-spinner"></span>
		{/if}
		Fetch Contributions
	</button>
</form>

{#if loading}
	<div class="mt-8 flex items-center justify-center">
		<span class="loading loading-spinner loading-lg"></span>
	</div>
{:else if form?.total_commits !== undefined}
	<div class="prose prose-xl mt-8">
		<h2>Contributions for {form.username}</h2>
		<p>Total Commits: {form.total_commits}</p>
		<p>
			Date Range: {new Date(form.since).toLocaleDateString()} - {new Date(
				form.until,
			).toLocaleDateString()}
		</p>

		{#if form.reached_limit}
			<p class="text-warning">{form.note}</p>
		{/if}

		<h3>Repositories Contributed To:</h3>
		<ul>
			{#each form.repositories as repo}
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
{:else if form?.error}
	<p class="text-error mt-8">{form.error}</p>
{:else}
	<p>No contributions data to display.</p>
{/if}
