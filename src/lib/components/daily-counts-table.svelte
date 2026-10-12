<script lang="ts">
	let {
		days,
		summary,
		caption,
		unit,
	}: {
		days: { key: string; count: number }[];
		summary: string;
		caption: string;
		// The count column's heading
		unit: string;
	} = $props();
</script>

<details class="mt-4 text-base sm:text-sm">
	<summary
		class="cursor-pointer text-muted-foreground hover:text-foreground"
		>{summary}</summary
	>
	<div class="mt-3 max-h-60 overflow-auto">
		<table class="w-full text-left tabular-nums">
			<caption class="sr-only">{caption}</caption>
			<thead>
				<tr>
					<th class="py-2 font-medium">Date (UTC)</th>
					<th class="py-2 text-right font-medium">{unit}</th>
				</tr>
			</thead>
			<tbody>
				{#each days as day (day.key)}
					<tr class="border-t">
						<td class="py-2">{day.key}</td>
						<td class="py-2 text-right">{day.count}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</details>
