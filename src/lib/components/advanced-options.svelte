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

<details
	class="group rounded-xl border border-border/70 bg-card/70 p-4"
>
	<summary
		class="flex cursor-pointer list-none items-center justify-between text-sm font-medium marker:hidden"
	>
		<span>Advanced range</span>
		<span
			class="text-muted-foreground transition group-open:rotate-180"
			>⌄</span
		>
	</summary>

	<div class="mt-4 grid gap-3">
		<RadioOption
			name="date_option"
			value="today"
			label="Today"
			bind:group={date_option}
			checked={date_option === 'today'}
		/>
		<RadioOption
			name="date_option"
			value="year"
			label="Specific year"
			bind:group={date_option}
		/>

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
		{/if}

		<RadioOption
			name="date_option"
			value="custom"
			label="Custom date range"
			bind:group={date_option}
		/>

		{#if date_option === 'custom'}
			<DateRange
				bind:since_value={since}
				bind:until_value={until}
				required={date_option === 'custom'}
			/>
		{/if}
	</div>
</details>
