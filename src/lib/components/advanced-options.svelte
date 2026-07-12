<script lang="ts">
	import DateRange from './date-range.svelte';
	import FormInput from './form-input.svelte';
	import RadioOption from './radio-option.svelte';

	let {
		date_option = $bindable('today'),
		year = $bindable(new Date().getFullYear().toString()),
		since = $bindable(''),
		until = $bindable(''),
	} = $props();
</script>

<details class="group border-t pt-4">
	<summary
		class="flex cursor-pointer list-none items-center justify-between text-sm text-muted-foreground marker:hidden hover:text-foreground"
	>
		<span>Specific year or custom dates</span>
		<span class="transition-transform group-open:rotate-45">+</span>
	</summary>

	<div
		class="mt-5 grid gap-4 rounded-md border bg-background p-4 sm:ml-20"
	>
		<div class="grid gap-2 sm:grid-cols-2">
			<RadioOption
				name="date_option"
				value="year"
				label="Specific year"
				bind:group={date_option}
			/>
			<RadioOption
				name="date_option"
				value="custom"
				label="Custom dates"
				bind:group={date_option}
			/>
		</div>

		{#if date_option === 'year'}
			<FormInput
				id="year"
				name="year"
				type="number"
				label="Year"
				bind:value={year}
				placeholder="2026"
				min="2008"
				max={new Date().getFullYear().toString()}
			/>
		{:else if date_option === 'custom'}
			<DateRange
				bind:since_value={since}
				bind:until_value={until}
				required
			/>
		{/if}
	</div>
</details>
