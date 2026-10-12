<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		get_contribution_range,
		request_contributions,
	} from '#lib/contributions.js';
	import type { github_contributions_result } from '#lib/server/github-contributions.js';
	import { cn } from '#lib/utils.js';
	import { RotateCw } from '@lucide/svelte';

	let {
		class: class_name = '',
		username = '',
	}: {
		class?: string;
		// Whose recent contributions to draw, once a handle is known
		username?: string;
	} = $props();
	let pattern = $state(0);
	let contributions = $state.raw<github_contributions_result | null>(
		null,
	);

	// The example pattern stays up until the handle's own days arrive,
	// and if they cannot be loaded
	$effect(() => {
		const handle = username;
		if (!handle) {
			contributions = null;
			return;
		}
		let cancelled = false;
		request_contributions(handle, get_contribution_range('last_year'))
			.then((result) => {
				if (!cancelled) contributions = result;
			})
			.catch(() => {
				if (!cancelled) contributions = null;
			});
		return () => {
			cancelled = true;
		};
	});

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
	type Cell = {
		index: number;
		color: string;
		day?: { date: string; count: number };
	};

	// The grid ends on this week, with today in its weekday's row
	const contribution_cells = $derived.by((): Cell[] | null => {
		const days = contributions?.daily_contributions;
		const last = days?.at(-1);
		if (!days || !last) return null;
		const last_index =
			rows * (columns - 1) +
			new Date(`${last.date}T00:00:00Z`).getUTCDay();
		const shown = days.slice(-(last_index + 1));
		const active = shown
			.map((day) => day.count)
			.filter((count) => count > 0)
			.sort((a, b) => a - b);
		// Shaded by quartile of the active days, as on GitHub
		const quartiles = [0.25, 0.5, 0.75].map(
			(share) => active[Math.floor(share * active.length)] ?? 1,
		);
		const first_index = last_index + 1 - shown.length;
		return Array.from({ length: rows * columns }, (_, index) => {
			const day = shown[index - first_index];
			if (!day) return { index, color: 'invisible' };
			const level =
				day.count === 0
					? 0
					: 1 + quartiles.filter((value) => day.count > value).length;
			return { index, color: colors[level], day };
		});
	});
	const shown_total = $derived(
		contribution_cells?.reduce(
			(total, cell) => total + (cell.day?.count ?? 0),
			0,
		) ?? 0,
	);
	const active_day = $derived(
		active_cell === null
			? undefined
			: contribution_cells?.[active_cell]?.day,
	);
	const format_day = (date: string) =>
		new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC',
		});

	const example_cells = $derived(
		Array.from({ length: rows * columns }, (_, index): Cell => {
			// A seeded pattern keeps server rendering and hydration identical.
			const seed =
				Math.imul(index + 1, 374761393) ^
				Math.imul(pattern + 1, 668265263);
			const value = Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0;
			return { index, color: colors[value % colors.length] };
		}),
	);
	const cells = $derived(contribution_cells ?? example_cells);

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
	<figcaption class="flex min-h-7 items-center justify-between gap-3">
		<span
			class="truncate font-mono text-xs tracking-wide text-muted-foreground uppercase"
		>
			{#if contribution_cells}
				@{contributions?.username} · last {columns} weeks
			{:else}
				Commit grid
			{/if}
		</span>
		{#if contribution_cells}
			<span
				class="font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums"
			>
				{#if active_day}
					{format_day(active_day.date)} ·
					{active_day.count.toLocaleString()}
				{:else}
					{shown_total.toLocaleString()} contributions
				{/if}
			</span>
		{:else}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onclick={() => (pattern += 1)}
				aria-label="Shuffle activity illustration"
				class="gap-2 font-mono text-xs text-muted-foreground"
			>
				Shuffle
				<RotateCw class="size-4 shrink-0" aria-hidden="true" />
			</Button>
		{/if}
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
					'aspect-square rounded-xs motion-safe:transition-[transform,background-color] motion-safe:duration-150',
					cell.color,
					'motion-safe:data-active:-translate-y-1 motion-safe:data-active:scale-125 motion-safe:data-near:scale-110',
					// A real day keeps its own shade under the pointer
					!cell.day &&
						'data-active:bg-primary data-near:bg-primary/65',
				)}
			></span>
		{/each}
	</div>
	<span class="sr-only" aria-live="polite" aria-atomic="true"
		>{contribution_cells
			? `${shown_total.toLocaleString()} contributions by ${contributions?.username} in the last ${columns} weeks`
			: `Illustration pattern ${pattern + 1}`}</span
	>
</figure>
