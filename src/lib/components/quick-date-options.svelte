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
		{ key: 'this_week', label: 'Week' },
		{ key: 'this_month', label: 'Month' },
		{ key: 'this_year', label: 'Year' },
	] as const;
</script>

<div class="grid gap-3 sm:grid-cols-[5rem_1fr] sm:items-center">
	<span class="section-kicker" id="range-label">Range</span>
	<div
		class="flex flex-wrap gap-x-1 gap-y-2"
		role="group"
		aria-labelledby="range-label"
	>
		{#each date_options as option (option.key)}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class={[
					'h-8 rounded-md px-3 font-normal',
					current_date_option === option.key
						? 'bg-accent text-accent-foreground hover:bg-accent/80'
						: 'text-muted-foreground',
				]}
				onclick={() => on_quick_date_select(option.key)}
			>
				{option.label}
			</Button>
		{/each}
	</div>
</div>
