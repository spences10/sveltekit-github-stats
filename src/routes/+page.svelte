<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let user: string = $page.url.searchParams.get('user')?.toString() || '';

	export let data: any;

	// const getData = async () => {
	// 	const res = await fetch(`${$page.url}github-contributions.json?user=spences10`);
	// 	if (res.ok) {
	// 		const data = await res.json();
	// 		return {
	// 			data
	// 		};
	// 	}
	// };

	// let userData: { data: any } | undefined;
	// onMount(async () => {
	// 	userData = await getData();
	// 	console.log(userData);
	// });
</script>

<pre>{JSON.stringify(data, null, 2)}</pre>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
