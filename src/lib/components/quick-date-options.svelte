<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		quick_date_options,
		type QuickDateOption,
	} from '#lib/date-ranges.js';
	let {
		on_quick_date_select,
		current_date_option = $bindable(),
		disabled = false,
	} = $props<{
		on_quick_date_select: (option: QuickDateOption) => void;
		current_date_option: string;
		disabled?: boolean;
	}>();
</script>

<div class="grid gap-3 sm:grid-cols-[6rem_1fr] sm:items-center">
	<span class="section-kicker" id="range-label">Time frame</span>
	<div
		class="flex flex-wrap gap-x-1 gap-y-2"
		role="group"
		aria-labelledby="range-label"
	>
		{#each quick_date_options as option (option.key)}
			<Button
				{disabled}
				aria-pressed={current_date_option === option.key}
				type="button"
				variant="ghost"
				size="sm"
				class={[
					'h-10 rounded-md px-4 font-medium',
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

<p class="text-base text-muted-foreground sm:text-xs">
	Dates use UTC. Weeks start Monday. Rolling ranges include today.
</p>
