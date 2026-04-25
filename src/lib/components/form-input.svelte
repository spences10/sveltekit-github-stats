<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

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
		class: class_name = '',
		disabled = false,
	} = $props();
</script>

{#if label}
	<div class="grid gap-2">
		<Label for={id}>{label}</Label>
		<Input
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
	<Input
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
