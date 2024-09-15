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

	const apiUrl = `https://api.github.com/search/commits?q=author:${username}+author-date:${since}..${until}`;

	try {
		const response = await fetch(apiUrl, {
			headers: {
				'Authorization': `token ${GITHUB_TOKEN}`,
				'Accept': 'application/vnd.github.v3+json',
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('GitHub API Error:', errorText);
			return json({ error: 'Failed to fetch data from GitHub' }, { status: response.status });
		}

		const data = await response.json();
		
		return json({
			username,
			totalCommits: data.total_count,
			since,
			until
		});
	} catch (error) {
		console.error('Error fetching GitHub data:', error);
		return json({ error: 'An error occurred while fetching data' }, { status: 500 });
	}
};