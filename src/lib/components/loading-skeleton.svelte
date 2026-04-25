<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="mt-10 grid gap-6">
	<div class="grid gap-3">
		<Skeleton class="h-8 w-2/3" />
		<Skeleton class="h-4 w-48" />
	</div>

	<div class="grid grid-cols-1 gap-3 md:grid-cols-4">
		{#each Array.from({ length: 4 }, (_, index) => index) as index (index)}
			<div class="rounded-xl border bg-card p-4">
				<Skeleton class="mb-4 h-4 w-24" />
				<Skeleton class="mb-2 h-8 w-16" />
				<Skeleton class="h-3 w-32" />
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<Skeleton class="h-80 rounded-xl" />
		<Skeleton class="h-80 rounded-xl" />
	</div>
	<Skeleton class="h-72 rounded-xl" />
</div>
