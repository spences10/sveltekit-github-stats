<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<section class="grid gap-6" aria-label="Loading commit data">
	<div class="panel p-6">
		<Skeleton class="h-4 w-48" />
		<div class="mt-6 grid gap-6 md:grid-cols-2">
			<Skeleton class="h-28" />
			<Skeleton class="h-28" />
		</div>
	</div>
	<Skeleton class="h-96 rounded-lg" />
	<div class="grid gap-6 xl:grid-cols-2">
		<Skeleton class="h-96 rounded-lg" />
		<Skeleton class="h-96 rounded-lg" />
	</div>
</section>
