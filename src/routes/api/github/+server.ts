import { GITHUB_TOKEN } from '$env/static/private';
import { json } from '@sveltejs/kit';

export const GET = async ({ url, fetch }) => {
	const username = url.searchParams.get('username');
	const today = new Date().toISOString().split('T')[0];
	const since = url.searchParams.get('since') || today;
	const until = url.searchParams.get('until') || today;

	if (!username) {
		return json({ error: 'Username is required' }, { status: 400 });
	}

	const api_url = `https://api.github.com/search/commits?q=author:${username}+author-date:${since}..${until}&per_page=100`;

	try {
		const response = await fetch(api_url, {
			headers: {
				Authorization: `token ${GITHUB_TOKEN}`,
				Accept: 'application/vnd.github.v3+json',
			},
		});

		if (!response.ok) {
			const error_text = await response.text();
			console.error('GitHub API Error:', error_text);
			return json(
				{ error: 'Failed to fetch data from GitHub' },
				{ status: response.status },
			);
		}

		const data = await response.json();

		interface RepoContribution {
			name: string;
			url: string;
			commits: number;
		}

		const repo_contributions = data.items.reduce(
			(acc: Record<string, RepoContribution>, item: any) => {
				const repo_name = item.repository.full_name;
				if (!acc[repo_name]) {
					acc[repo_name] = {
						name: repo_name,
						url: item.repository.html_url,
						commits: 0,
					};
				}
				acc[repo_name].commits++;
				return acc;
			},
			{},
		);

		const sorted_repositories = (
			Object.values(repo_contributions) as RepoContribution[]
		).sort((a, b) => b.commits - a.commits);

		return json({
			username,
			total_commits: data.total_count,
			since,
			until,
			repositories: sorted_repositories,
		});
	} catch (error) {
		console.error('Error fetching GitHub data:', error);
		return json(
			{ error: 'An error occurred while fetching data' },
			{ status: 500 },
		);
	}
};
