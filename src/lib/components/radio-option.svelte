<script lang="ts">
	let {
		name,
		value,
		label,
		group = $bindable(''),
		checked = false,
		class: class_name = 'radio radio-sm',
	} = $props();

	let bind_group = $state(group);

	$effect(() => {
		group = bind_group;
	});
</script>

<label class="flex cursor-pointer items-center justify-between">
	<span class="fieldset-label">{label}</span>
	<input
		type="radio"
		{name}
		{value}
		class={class_name}
		bind:group
		{checked}
	/>
</label>
