import type { github_contributions_result } from '#lib/server/github-contributions.js';

type DateRange = { since: string; until: string };

const date_key = (date: Date) => date.toISOString().slice(0, 10);

/** The last year, or one calendar year, up to today */
export const get_contribution_range = (period: string): DateRange => {
	const today = date_key(new Date());
	if (period === 'last_year') {
		const start = new Date();
		start.setUTCFullYear(start.getUTCFullYear() - 1);
		start.setUTCDate(start.getUTCDate() + 1);
		return { since: date_key(start), until: today };
	}
	const year_end = `${period}-12-31`;
	return {
		since: `${period}-01-01`,
		until: year_end < today ? year_end : today,
	};
};

// The hero grid and the calendar ask for the same year, so they share
// one request for as long as the page is open
const requests = new Map<
	string,
	Promise<github_contributions_result>
>();

export const request_contributions = (
	username: string,
	range: DateRange,
) => {
	const params = new URLSearchParams({ username, ...range });
	const key = params.toString().toLowerCase();
	let request = requests.get(key);
	if (!request) {
		request = fetch(`/api/github-contributions?${params}`).then(
			async (response) => {
				if (!response.ok) throw new Error(await response.text());
				return (await response.json()) as github_contributions_result;
			},
		);
		requests.set(key, request);
		// A failed request can be tried again
		request.catch(() => requests.delete(key));
	}
	return request;
};
