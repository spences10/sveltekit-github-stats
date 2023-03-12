import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ fetch, url }) => {
	console.log('=====================');
	console.log(url.searchParams);
	console.log('=====================');
	const res = await fetch('github-contributions.json?user=spences10');
	if (res.ok) {
		const data = await res.json();
		return {
			data
		};
	}
};
