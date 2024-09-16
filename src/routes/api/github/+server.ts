import { GITHUB_TOKEN } from '$env/static/private';
import { json } from '@sveltejs/kit';

export const GET = async ({ url, fetch }) => {
	const username = url.searchParams.get('username');
	const since = url.searchParams.get('since');
	const until = url.searchParams.get('until');

	if (!username || !since || !until) {
		return json(
			{ error: 'Username, since, and until are required' },
			{ status: 400 },
		);
	}
	const per_page = 100;
	let all_items: any[] = [];
	let total_count = 0;
	let reached_limit = false;

	try {
		for (let page = 1; page <= 10; page++) {
			const api_url = `https://api.github.com/search/commits?q=author:${username}+author-date:${since}..${until}&sort=author-date&order=desc&per_page=${per_page}&page=${page}`;

			const response = await fetch(api_url, {
				headers: {
					Authorization: `token ${GITHUB_TOKEN}`,
					Accept: 'application/vnd.github.v3+json',
				},
			});

			if (!response.ok) {
				const error_text = await response.text();
				console.error('GitHub API Error:', error_text);
				if (response.status === 422) {
					reached_limit = true;
					break;
				}
				return json(
					{ error: 'Failed to fetch data from GitHub' },
					{ status: response.status },
				);
			}

			const data = await response.json();
			all_items = all_items.concat(data.items);
			total_count = Math.min(data.total_count, 1000); // Cap at 1000

			if (data.items.length < per_page || all_items.length >= 1000) {
				reached_limit = all_items.length >= 1000;
				break;
			}
		}

		const repo_contributions = all_items.reduce((acc, item) => {
			const repo_name = item.repository.full_name;
			if (!acc[repo_name]) {
				acc[repo_name] = {
					name: repo_name,
					url: item.repository.html_url,
					commits: 0,
					last_updated: new Date(item.commit.author.date),
				};
			}
			acc[repo_name].commits++;
			acc[repo_name].last_updated = new Date(
				Math.max(
					acc[repo_name].last_updated.getTime(),
					new Date(item.commit.author.date).getTime(),
				),
			);
			return acc;
		}, {});

		const sorted_repositories = Object.values(
			repo_contributions,
		).sort((a, b) => b.last_updated - a.last_updated);

		return json({
			username,
			total_commits: total_count,
			since,
			until,
			repositories: sorted_repositories,
			reached_limit,
			note: reached_limit
				? 'Due to GitHub API limitations, only the first 1000 results are shown. The total commit count and repository list may be incomplete for large date ranges.'
				: null,
		});
	} catch (error) {
		console.error('Error fetching GitHub data:', error);
		return json(
			{ error: 'An error occurred while fetching data' },
			{ status: 500 },
		);
	}
};
