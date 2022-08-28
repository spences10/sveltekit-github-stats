export const load = async ({ url }: any) => {
	const res = await fetch(`${url.href}github-contributions.json?user=spences10`);
	if (res.ok) {
		const data = await res.json();
		return {
			data
		};
	}
};
