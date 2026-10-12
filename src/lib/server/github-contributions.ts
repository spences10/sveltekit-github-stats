import { GITHUB_TOKEN } from '$app/env/private';
import * as v from 'valibot';
import {
	github_params_schema,
	type github_params,
} from './github-stats.js';

export const github_contributions_schema = v.object({
	username: v.string(),
	since: v.string(),
	until: v.string(),
	total_contributions: v.number(),
	// Every year the account has contributions in, newest first
	years: v.array(v.number()),
	daily_contributions: v.array(
		v.object({ date: v.string(), count: v.number() }),
	),
});

export type github_contributions_result = v.InferOutput<
	typeof github_contributions_schema
>;

type contributions_response = {
	data?: {
		user: {
			contributionsCollection: {
				contributionYears: number[];
				contributionCalendar: {
					totalContributions: number;
					weeks: {
						contributionDays: {
							date: string;
							contributionCount: number;
						}[];
					}[];
				};
			};
		} | null;
	};
	errors?: { message: string }[];
};

const query = `query ($login: String!, $from: DateTime!, $to: DateTime!) {
	user(login: $login) {
		contributionsCollection(from: $from, to: $to) {
			contributionYears
			contributionCalendar {
				totalContributions
				weeks { contributionDays { date contributionCount } }
			}
		}
	}
}`;

/**
 * The contribution calendar GitHub shows on a profile: commits, pull
 * requests, issues and reviews per day. Unlike commit search it has no
 * 1,000-result limit, but GitHub serves at most a year at a time.
 */
export async function get_github_contributions_data(
	params: github_params,
): Promise<github_contributions_result> {
	const { username, since, until } = v.parse(
		github_params_schema,
		params,
	);
	if (!GITHUB_TOKEN)
		throw new Error('GITHUB_TOKEN is not configured.');
	if ((Date.parse(until) - Date.parse(since)) / 86400000 > 366)
		throw new Error(
			'Contributions cover at most one year at a time.',
		);

	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			'Content-Type': 'application/json',
			'User-Agent': 'sveltekit-github-stats',
		},
		body: JSON.stringify({
			query,
			variables: {
				login: username,
				from: `${since}T00:00:00Z`,
				to: `${until}T23:59:59Z`,
			},
		}),
	});
	if (!response.ok)
		throw new Error(
			`Failed to fetch contributions from GitHub: ${response.status}`,
		);

	const body = (await response.json()) as contributions_response;
	const user = body.data?.user;
	if (!user) {
		const message = body.errors?.[0]?.message;
		throw new Error(
			message
				? `GitHub could not load contributions: ${message}`
				: `No GitHub user found for ${username}.`,
		);
	}

	const { contributionYears, contributionCalendar } =
		user.contributionsCollection;
	return v.parse(github_contributions_schema, {
		username,
		since,
		until,
		total_contributions: contributionCalendar.totalContributions,
		years: contributionYears,
		daily_contributions: contributionCalendar.weeks.flatMap((week) =>
			week.contributionDays.map((day) => ({
				date: day.date,
				count: day.contributionCount,
			})),
		),
	});
}
