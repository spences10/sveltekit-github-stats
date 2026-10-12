<script lang="ts">
	let {
		thresholds,
		colors,
		unit,
	}: {
		thresholds: number[];
		// One more colour than thresholds: the first is for no activity
		colors: string[];
		unit: string;
	} = $props();
</script>

<div
	class="flex flex-wrap gap-4 border-t px-5 py-4 text-sm text-muted-foreground sm:px-6"
	aria-label="Legend: {unit}"
>
	{#each colors as color, index (color)}
		<span class="flex items-center gap-2"
			><span class="size-3 bg-(--swatch)" style={`--swatch: ${color}`}
			></span>{index === 0
				? '0'
				: `${thresholds[index - 1]}${index === colors.length - 1 ? '+' : thresholds[index] - 1 > thresholds[index - 1] ? `–${thresholds[index] - 1}` : ''}`}</span
		>
	{/each}
	<span>{unit}</span>
</div>
