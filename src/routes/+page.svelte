<script lang="ts">
	let username = ''
	let year = '2022'
	let contributions: { totalContributions: any; weeks: any } | null =
		null

	let loading = false

	const fetch_contributions = async () => {
		loading = true
		const response = await fetch(
			`github?username=${username}&year=${year}`
		)
		const data = await response.json()

		if (data.data && data.data.user) {
			contributions =
				data.data.user.contributionsCollection.contributionCalendar
		} else {
			contributions = null
		}

		loading = false
	}

	const handle_submit = () => {
		fetch_contributions()
	}
</script>

<form
	method="POST"
	on:submit|preventDefault={handle_submit}
	class="flex flex-col max-w-4xl space-y-4 my-10"
>
	<input
		bind:value={username}
		placeholder="Enter GitHub username"
		required
		class="input input-primary"
	/>
	<input
		type="number"
		bind:value={year}
		placeholder="Year (e.g., 2022)"
		min="2008"
		required
		class="input input-primary"
	/>
	<button type="submit" disabled={loading} class="btn btn-primary">
		Fetch Contributions
	</button>
</form>

<div class="prose prose-xl">
	{#if loading}
		<p>Loading...</p>
	{:else if contributions}
		<div>
			<h2>Total Contributions: {contributions.totalContributions}</h2>
			<h3>Contribution Details:</h3>
			{#each contributions.weeks as week}
				{#each week.contributionDays as day}
					<p>
						Date: {day.date}, Contributions: {day.contributionCount}
					</p>
				{/each}
			{/each}
		</div>
	{:else}
		<p>No contributions data to display.</p>
	{/if}
</div>
