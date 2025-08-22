import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const date_param = url.searchParams.get('date');
	let initial_date = '';
	let initial_date_option = 'today';

	if (date_param) {
		const date_regex = /^\d{4}-\d{2}-\d{2}$/;
		if (date_regex.test(date_param)) {
			initial_date = date_param;
			initial_date_option = 'custom';
		}
	}

	return {
		initial_date,
		initial_date_option,
	};
};
