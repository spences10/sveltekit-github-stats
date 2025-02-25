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
		<input
			type="text"
			class="input input-lg rounded-box mb-4 w-full"
			placeholder="Enter GitHub username"
			id="username"
			name="username"
			bind:value={username}
			required
		/>
	</fieldset>

	<div
		class="bg-base-100 border-base-300 rounded-box collapse-arrow collapse border"
	>
		<input type="checkbox" />
		<div class="collapse-title font-semibold">Advanced Options</div>
		<div class="collapse-content text-sm space-y-2">
			<label class="flex cursor-pointer items-center justify-between">
				<span class="fieldset-label">Today</span>
				<input
					type="radio"
					name="date_option"
					value="today"
					class="radio radio-sm"
					bind:group={date_option}
					checked
				/>
			</label>

			<label class="flex cursor-pointer items-center justify-between">
				<span class="fieldset-label">Specific Year</span>
				<input
					type="radio"
					name="date_option"
					value="year"
					class="radio radio-sm"
					bind:group={date_option}
				/>
			</label>

			{#if date_option === 'year'}
				<div class="mb-4">
					<label for="year" class="fieldset-label mb-2 block"
						>Year</label
					>
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

			<label class="flex cursor-pointer items-center justify-between">
				<span class="fieldset-label">Custom Date Range</span>
				<input
					type="radio"
					name="date_option"
					value="custom"
					class="radio radio-sm"
					bind:group={date_option}
				/>
			</label>

			{#if date_option === 'custom'}
				<div class="mb-4">
					<label for="since" class="fieldset-label mb-2 block">
						Since
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

				<div class="mb-4">
					<label for="until" class="fieldset-label mb-2 block">
						Until
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
