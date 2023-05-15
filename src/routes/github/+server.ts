import { GITHUB_GRAPHQL_TOKEN } from '$env/static/private'
import { json } from '@sveltejs/kit'

export const GET = async ({ url, fetch }) => {
	const username = url.searchParams.get('username')
	const year = url.searchParams.get('year')

	const query = `
		{
			user(login: "${username}") {
				contributionsCollection(
					from: "${year}-01-01T00:00:00Z"
					to: "${year}-12-31T23:59:59Z"
				) {
					contributionCalendar {
						totalContributions
						weeks {
							contributionDays {
								contributionCount
								date
								weekday
							}
						}
					}
				}
			}
		}
		`

	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${GITHUB_GRAPHQL_TOKEN}`,
		},
		body: JSON.stringify({ query }),
	})

	const data = await response.json()

	return json(data)
}
