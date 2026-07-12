<script lang="ts">
	let {
		name,
		value,
		label,
		group = $bindable(''),
		checked = false,
	} = $props();
</script>

<label class="flex cursor-pointer items-center gap-3 py-2 text-sm">
	<input
		type="radio"
		{name}
		{value}
		class="size-3.5 border-input bg-transparent text-primary focus:ring-ring"
		bind:group
		{checked}
	/>
	<span>{label}</span>
</label>
