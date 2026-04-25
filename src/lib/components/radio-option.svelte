<script lang="ts">
	let {
		name,
		value,
		label,
		group = $bindable(''),
		checked = false,
	} = $props();
</script>

<label
	class="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm transition-colors hover:bg-muted/70"
>
	<span>{label}</span>
	<input
		type="radio"
		{name}
		{value}
		class="size-4 border-input text-primary focus:ring-ring"
		bind:group
		{checked}
	/>
</label>
