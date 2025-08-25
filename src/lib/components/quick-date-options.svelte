<script lang="ts">
	let {
		on_quick_date_select = $bindable(),
		current_date_option = $bindable(),
	} = $props<{
		on_quick_date_select: (
			option:
				| 'today'
				| 'yesterday'
				| 'this_week'
				| 'this_month'
				| 'this_year',
		) => void;
		current_date_option: string;
	}>();

	const date_options = [
		{ key: 'today', label: 'Today' },
		{ key: 'yesterday', label: 'Yesterday' },
		{ key: 'this_week', label: 'This Week' },
		{ key: 'this_month', label: 'This Month' },
		{ key: 'this_year', label: 'This Year' },
	] as const;
</script>

<fieldset class="mb-4 fieldset">
	<legend class="fieldset-legend">Quick Date Ranges</legend>
	<div class="join grid w-full grid-cols-2 sm:grid-cols-5">
		{#each date_options as option}
			<button
				type="button"
				class="btn join-item btn-lg {current_date_option ===
				option.key
					? 'btn-primary'
					: ''}"
				onclick={() => on_quick_date_select(option.key)}
			>
				{option.label}
			</button>
		{/each}
	</div>
</fieldset>
