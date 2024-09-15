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

<form method="POST" class="form-control w-full">
	<label for="username" class="label">
		<span class="label-text">GitHub Username</span>
	</label>
	<input
		id="username"
		name="username"
		bind:value={username}
		placeholder="Enter GitHub username"
		required
		class="input input-bordered w-full"
	/>
	<button type="submit" class="btn btn-primary mt-4">
		Fetch Today's Contributions
	</button>

	<div class="divider">Advanced Options</div>

	<div class="collapse collapse-plus bg-base-200">
		<input type="checkbox" bind:checked={show_advanced_options} /> 
		<div class="collapse-title text-xl font-medium">
			Show Advanced Options
		</div>
		<div class="collapse-content">
			<div class="form-control">
				<label for="year" class="label">
					<span class="label-text">Year</span>
				</label>
				<input
					id="year"
					name="year"
					type="number"
					bind:value={year}
					placeholder="Year (e.g., 2023)"
					min="2008"
					max={new Date().getFullYear()}
					class="input input-bordered w-full"
				/>
			</div>
			<div class="form-control">
				<label for="since" class="label">
					<span class="label-text">Since</span>
				</label>
				<input
					id="since"
					name="since"
					type="date"
					bind:value={since}
					class="input input-bordered w-full"
				/>
			</div>
			<div class="form-control">
				<label for="until" class="label">
					<span class="label-text">Until</span>
				</label>
				<input
					id="until"
					name="until"
					type="date"
					bind:value={until}
					class="input input-bordered w-full"
				/>
			</div>
		</div>
	</div>
</form>

<div class="prose prose-xl mt-8">
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
