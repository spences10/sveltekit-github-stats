<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="bg-base-200 flex min-h-screen flex-col">
	<main class="flex flex-grow items-center justify-center p-4">
		<div
			class="rounded-box bg-base-100 container mx-auto max-w-3xl p-8 shadow-xl"
		>
			<h1 class="mb-8 text-center text-3xl font-bold">
				GitHub Contribution Tracker
			</h1>
			{@render children()}
		</div>
	</main>

	<footer
		class="footer footer-center bg-base-300 text-base-content p-4"
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
