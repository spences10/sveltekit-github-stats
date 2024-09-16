<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
	let username = $state(form?.username || '');
	let show_advanced_options = $state(false);
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
	class="form-control w-full"
	onsubmit={handle_submit}
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			await update({ reset: false });
			loading = false;
		};
	}}
>
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

	<div class="divider">Advanced Options</div>

	<div class="collapse collapse-plus bg-base-200">
		<input type="checkbox" bind:checked={show_advanced_options} />
		<div class="collapse-title text-xl font-medium">
			Show Advanced Options
		</div>
		<div class="collapse-content">
			<div class="form-control">
				<label class="label cursor-pointer">
					<span class="label-text">Today</span>
					<input
						type="radio"
						name="date_option"
						value="today"
						class="radio"
						bind:group={date_option}
						checked
					/>
				</label>
			</div>
			<div class="form-control">
				<label class="label cursor-pointer">
					<span class="label-text">Specific Year</span>
					<input
						type="radio"
						name="date_option"
						value="year"
						class="radio"
						bind:group={date_option}
					/>
				</label>
			</div>
			{#if date_option === 'year'}
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
			{/if}
			<div class="form-control">
				<label class="label cursor-pointer">
					<span class="label-text">Custom Date Range</span>
					<input
						type="radio"
						name="date_option"
						value="custom"
						class="radio"
						bind:group={date_option}
					/>
				</label>
			</div>
			{#if date_option === 'custom'}
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
						required={date_option === 'custom'}
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
						required={date_option === 'custom'}
					/>
				</div>
			{/if}
		</div>
	</div>

	<button
		type="submit"
		class="btn btn-primary mt-4"
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
	<p class="mt-8 text-error">{form.error}</p>
{:else}
	<p>No contributions data to display.</p>
{/if}
