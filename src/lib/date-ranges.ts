export const quick_date_options = [
	{ key: 'today', label: 'Today' },
	{ key: 'yesterday', label: 'Yesterday' },
	{ key: 'this_week', label: 'This week' },
	{ key: 'last_week', label: 'Last week' },
	{ key: 'this_month', label: 'This month' },
	{ key: 'last_month', label: 'Last month' },
	{ key: 'last_7_days', label: 'Last 7 days' },
	{ key: 'last_30_days', label: 'Last 30 days' },
	{ key: 'this_year', label: 'This year' },
] as const;

export type QuickDateOption =
	(typeof quick_date_options)[number]['key'];

export function get_date_range(
	option: string,
	now: Date,
	year: string,
	since: string,
	until: string,
) {
	const today = new Date(
		Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate(),
		),
	);
	const start = new Date(today);
	const end = new Date(today);
	switch (option) {
		case 'today':
			break;
		case 'yesterday':
			start.setUTCDate(start.getUTCDate() - 1);
			end.setUTCDate(end.getUTCDate() - 1);
			break;
		case 'this_week':
		case 'last_week':
			start.setUTCDate(
				start.getUTCDate() - ((start.getUTCDay() + 6) % 7),
			);
			if (option === 'last_week') {
				end.setTime(start.getTime());
				end.setUTCDate(end.getUTCDate() - 1);
				start.setUTCDate(start.getUTCDate() - 7);
			}
			break;
		case 'this_month':
			start.setUTCDate(1);
			break;
		case 'last_month':
			start.setUTCDate(1);
			end.setTime(start.getTime());
			end.setUTCDate(0);
			start.setUTCMonth(start.getUTCMonth() - 1);
			break;
		case 'last_7_days':
			start.setUTCDate(start.getUTCDate() - 6);
			break;
		case 'last_30_days':
			start.setUTCDate(start.getUTCDate() - 29);
			break;
		case 'this_year':
			start.setUTCMonth(0, 1);
			break;
		case 'year':
			return {
				calculated_since: `${year}-01-01`,
				calculated_until: `${year}-12-31`,
			};
		default:
			return { calculated_since: since, calculated_until: until };
	}
	return {
		calculated_since: start.toISOString().slice(0, 10),
		calculated_until: end.toISOString().slice(0, 10),
	};
}
