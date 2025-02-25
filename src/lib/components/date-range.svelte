<script lang="ts">
	import FormInput from './form-input.svelte';

	let {
		since_value = $bindable(''),
		until_value = $bindable(''),
		required = false,
	} = $props();

	let since = $state(since_value);
	let until = $state(until_value);

	$effect(() => {
		since_value = since;
		until_value = until;
	});
</script>

<div class="space-y-2">
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
