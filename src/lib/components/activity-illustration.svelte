<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';

	let { class: class_name = '' } = $props<{ class?: string }>();
	let pattern = $state(0);
	let active_cell = $state<number | null>(null);
	const rows = 7;
	const columns = 18;
	const colors = [
		'bg-primary/8',
		'bg-primary/20',
		'bg-primary/40',
		'bg-primary/65',
		'bg-primary',
	];
	const cells = $derived(
		Array.from({ length: rows * columns }, (_, index) => {
			// A seeded pattern keeps server rendering and hydration identical.
			const seed =
				Math.imul(index + 1, 374761393) ^
				Math.imul(pattern + 1, 668265263);
			const value = Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0;
			return { index, color: colors[value % colors.length] };
		}),
	);

	function follow_pointer(event: PointerEvent) {
		if (event.pointerType === 'touch') return;
		const bounds = (
			event.currentTarget as HTMLDivElement
		).getBoundingClientRect();
		const column = Math.max(
			0,
			Math.min(
				columns - 1,
				Math.floor(
					((event.clientX - bounds.left) / bounds.width) * columns,
				),
			),
		);
		const row = Math.max(
			0,
			Math.min(
				rows - 1,
				Math.floor(
					((event.clientY - bounds.top) / bounds.height) * rows,
				),
			),
		);
		active_cell = column * rows + row;
	}

	function is_near(index: number) {
		if (active_cell === null) return false;
		return (
			Math.abs(
				Math.floor(index / rows) - Math.floor(active_cell / rows),
			) +
				Math.abs((index % rows) - (active_cell % rows)) ===
			1
		);
	}
</script>

<figure
	class={cn('grid min-w-0 gap-5 border-y py-6 lg:py-8', class_name)}
>
	<figcaption class="flex items-center justify-between gap-3">
		<span
			class="font-mono text-xs tracking-wide text-muted-foreground uppercase"
		>
			Commit grid
		</span>
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onclick={() => (pattern += 1)}
			aria-label="Shuffle activity illustration"
			class="gap-2 font-mono text-xs text-muted-foreground"
			>Shuffle <span aria-hidden="true">↻</span></Button
		>
	</figcaption>
	<div
		class="grid grid-flow-col grid-rows-7 gap-1.5"
		aria-hidden="true"
		onpointermove={follow_pointer}
		onpointerleave={() => (active_cell = null)}
		onpointercancel={() => (active_cell = null)}
	>
		{#each cells as cell (cell.index)}
			<span
				data-active={cell.index === active_cell || undefined}
				data-near={is_near(cell.index) || undefined}
				class={cn(
					'aspect-square rounded-xs motion-safe:transition-transform motion-safe:duration-150',
					cell.color,
					'data-active:bg-primary data-near:bg-primary/65 motion-safe:data-active:-translate-y-1 motion-safe:data-active:scale-125 motion-safe:data-near:scale-110',
				)}
			></span>
		{/each}
	</div>
	<span class="sr-only" aria-live="polite" aria-atomic="true"
		>Illustration pattern {pattern + 1}</span
	>
</figure>
