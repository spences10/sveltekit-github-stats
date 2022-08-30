import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ fetch }) => {
	const res = await fetch('/github-contributions.json?user=spences10');
	if (res.ok) {
		const data = await res.json();
		return {
			data
		};
	}
};
