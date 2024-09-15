<script lang="ts">
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
	let username = $state('');
	let show_advanced_options = $state(false);
	let year = $state(new Date().getFullYear().toString());
	let since = $state('');
	let until = $state('');

	$effect(() => {
		if (!show_advanced_options) {
			const today = new Date().toISOString().split('T')[0];
			since = today;
			until = today;
		}
	});
</script>

<form method="POST" class="my-10 flex max-w-4xl flex-col space-y-4">
	<input
		name="username"
		bind:value={username}
		placeholder="Enter GitHub username"
		required
		class="input input-primary"
	/>
	<button type="submit" class="btn btn-primary">
		Fetch Today's Contributions
	</button>

	<details bind:open={show_advanced_options}>
		<summary class="cursor-pointer">Advanced Options</summary>
		<div class="mt-4 space-y-4">
			<input
				name="year"
				type="number"
				bind:value={year}
				placeholder="Year (e.g., 2023)"
				min="2008"
				max={new Date().getFullYear()}
				class="input input-primary"
			/>
			<input
				name="since"
				type="date"
				bind:value={since}
				placeholder="Since"
				class="input input-primary"
			/>
			<input
				name="until"
				type="date"
				bind:value={until}
				placeholder="Until"
				class="input input-primary"
			/>
		</div>
	</details>
</form>

<div class="prose prose-xl">
	{#if form?.loading}
		<p>Loading...</p>
	{:else if form?.total_commits !== undefined}
		<div>
			<h2>Contributions for {form.username}</h2>
			<p>Total Commits: {form.total_commits}</p>
			<p>
				Date Range: {new Date(form.since).toLocaleDateString()} - {new Date(
					form.until,
				).toLocaleDateString()}
			</p>

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
					</li>
				{/each}
			</ul>
		</div>
	{:else if form?.error}
		<p class="text-error">{form.error}</p>
	{:else}
		<p>No contributions data to display.</p>
	{/if}
</div>
