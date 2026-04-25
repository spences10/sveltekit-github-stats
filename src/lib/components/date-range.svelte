<script lang="ts">
	import FormInput from './form-input.svelte';

	let {
		since_value = $bindable(''),
		until_value = $bindable(''),
		required = false,
	} = $props();
</script>

<div class="grid gap-3 sm:grid-cols-2">
	<FormInput
		id="since"
		name="since"
		type="date"
		label="Since"
		bind:value={since_value}
		{required}
	/>

	<FormInput
		id="until"
		name="until"
		type="date"
		label="Until"
		bind:value={until_value}
		{required}
	/>
</div>
