<script lang="ts">
	interface Props {
		height?: string;
		width?: string;
		class_names?: string;
		aria_label?: string;
		rotated?: boolean;
	}

	let {
		height = '24px',
		width = '24px',
		class_names = '',
		aria_label = 'Chevron icon',
		rotated = false,
	}: Props = $props();

	const rotation_class = $derived(rotated ? 'rotate-180' : '');
	const combined_classes = $derived(
		`transition-transform duration-200 ease-in-out ${rotation_class} ${class_names}`.trim(),
	);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	{height}
	{width}
	class={combined_classes}
	fill="none"
	viewBox="0 0 24 24"
	stroke-width="2"
	stroke="currentColor"
	aria-label={aria_label}
	role="img"
>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="M4.5 15.75l7.5-7.5 7.5 7.5"
	/>
</svg>
