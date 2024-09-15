import { GITHUB_TOKEN } from '$env/static/private';
import { json } from '@sveltejs/kit';

export const GET = async ({ url, fetch }) => {
	const username = url.searchParams.get('username');
	const year = url.searchParams.get('year');

	if (!username || !year) {
		return json(
			{ error: 'Username and year are required' },
			{ status: 400 },
		);
	}

	const startDate = `${year}-01-01`;
	const endDate = `${year}-12-31`;

	const apiUrl = `https://api.github.com/users/${username}/contributions?from=${startDate}&to=${endDate}`;

	const response = await fetch(apiUrl, {
		headers: {
			Authorization: `token ${GITHUB_TOKEN}`,
			Accept: 'application/vnd.github.v3+json',
		},
	});

	if (!response.ok) {
		return json(
			{ error: 'Failed to fetch data from GitHub' },
			{ status: response.status },
		);
	}

	const data = await response.json();

	console.log('=====================')
	console.log(data)
	console.log('=====================')

	return json(data);
};
