<script lang="ts">
	let {
		id,
		name,
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		label = '',
		required = false,
		min = '',
		max = '',
		class: class_name = 'input input-bordered w-full',
		disabled = false,
	} = $props();

	let bind_value = $state(value);

	$effect(() => {
		value = bind_value;
	});
</script>

{#if label}
	<div class="mb-4">
		<label for={id} class="mb-2 fieldset-label block">{label}</label>
		<input
			{id}
			{name}
			{type}
			{placeholder}
			{required}
			{min}
			{max}
			{disabled}
			class={class_name}
			bind:value
		/>
	</div>
{:else}
	<input
		{id}
		{name}
		{type}
		{placeholder}
		{required}
		{min}
		{max}
		{disabled}
		class={class_name}
		bind:value
	/>
{/if}
