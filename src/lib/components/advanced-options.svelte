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

<fieldset
	class="collapse-arrow collapse rounded-box border border-base-300 bg-base-100"
>
	<input type="checkbox" />
	<div class="collapse-title font-semibold">Advanced Options</div>
	<div class="collapse-content space-y-2 text-sm">
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
			label="Specific Year"
			bind:group={date_option}
		/>

		{#if date_option === 'year'}
			<FormInput
				id="year"
				name="year"
				type="number"
				label="Year"
				bind:value={year}
				placeholder="Year (e.g., 2023)"
				min="2008"
				max={new Date().getFullYear().toString()}
			/>
		{/if}

		<RadioOption
			name="date_option"
			value="custom"
			label="Custom Date Range"
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
</fieldset>
