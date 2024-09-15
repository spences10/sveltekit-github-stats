<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-base-200">
	<main class="flex flex-grow items-center justify-center p-4">
		<div
			class="container mx-auto max-w-3xl rounded-box bg-base-100 p-8 shadow-xl"
		>
			<h1 class="mb-8 text-center text-3xl font-bold">
				GitHub Contribution Tracker
			</h1>
			{@render children()}
		</div>
	</main>

	<footer
		class="footer footer-center bg-base-300 p-4 text-base-content"
	>
		<div>
			<p>
				Copyright &copy; 2017 - {new Date().getFullYear()} - All rights
				reserved by Scott Spence
			</p>
		</div>
	</footer>
</div>
