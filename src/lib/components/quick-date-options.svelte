<script lang="ts">
	import { Button } from '$lib/components/ui/button';

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
		{ key: 'this_week', label: 'This week' },
		{ key: 'this_month', label: 'This month' },
		{ key: 'this_year', label: 'This year' },
	] as const;
</script>

<fieldset class="grid gap-2">
	<legend class="text-sm font-medium text-muted-foreground"
		>Quick range</legend
	>
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
		{#each date_options as option (option.key)}
			<Button
				type="button"
				variant={current_date_option === option.key
					? 'default'
					: 'outline'}
				size="lg"
				class="h-10"
				onclick={() => on_quick_date_select(option.key)}
			>
				{option.label}
			</Button>
		{/each}
	</div>
</fieldset>
