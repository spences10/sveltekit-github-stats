<script lang="ts">
	// Loading skeleton for the stats display
</script>

<div class="mt-8 space-y-6">
	<!-- Header Skeleton -->
	<div class="space-y-2 text-center">
		<div class="mx-auto h-8 w-3/4 skeleton"></div>
		<div class="mx-auto h-4 w-1/2 skeleton"></div>
	</div>

	<!-- Stats Overview Skeleton -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each Array(4) as _}
			<div class="stat rounded-box bg-base-100 shadow-xl">
				<div class="mb-2 h-6 w-16 skeleton"></div>
				<div class="mb-2 h-10 w-20 skeleton"></div>
				<div class="h-4 w-24 skeleton"></div>
			</div>
		{/each}
	</div>

	<!-- Charts Skeleton -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Activity Chart Skeleton -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-4 h-6 w-32 skeleton"></div>
				<div class="h-32 w-full skeleton"></div>
			</div>
		</div>

		<!-- Distribution Chart Skeleton -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-4 h-6 w-32 skeleton"></div>
				<div class="flex gap-6">
					<div class="h-48 w-48 skeleton rounded-full"></div>
					<div class="flex-1 space-y-4">
						{#each Array(5) as _}
							<div class="flex items-center gap-3">
								<div class="h-4 w-4 skeleton rounded-full"></div>
								<div class="h-4 flex-1 skeleton"></div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Repository Cards Skeleton -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="mb-4 h-6 w-32 skeleton"></div>
			<div class="space-y-4">
				{#each Array(6) as _}
					<div class="h-20 w-full skeleton rounded-lg"></div>
				{/each}
			</div>
		</div>
	</div>
</div>
