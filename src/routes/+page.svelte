<script lang="ts">
	import { page } from '$app/stores';

	let user: string = $page.url.searchParams.get('user')?.toString() || '';

	export let data: any;
</script>

<pre>{JSON.stringify(user, null, 2)}</pre>
<pre>{JSON.stringify(data, null, 2)}</pre>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
