<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-base-200">
	<main class="flex flex-grow items-center justify-center p-4">
		<div
			class="container mx-auto max-w-3xl rounded-box bg-base-100 p-8 shadow-xl"
		>
			<h1 class="mb-8 text-center text-3xl font-bold">
				GitHub Contribution Tracker
			</h1>
			{@render children?.()}
		</div>
	</main>

	<footer
		class="footer-center footer bg-base-300 p-4 text-base-content"
	>
		<div>
			<p>
				Copyright &copy; 2020 - {new Date().getFullYear()} - Made with
				🤖 and ❤️ by
				<a class="link link-primary" href="https://scottspence.com">
					Scott Spence
				</a>
			</p>
		</div>
	</footer>
</div>
