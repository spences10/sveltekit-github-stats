import { env } from '$env/dynamic/private';
import * as v from 'valibot';

const repo_contribution_schema = v.object({
	name: v.string(),
	url: v.string(),
	commits: v.number(),
	last_updated: v.string(),
});

const github_stats_schema = v.object({
	username: v.string(),
	total_commits: v.number(),
	since: v.string(),
	until: v.string(),
	repositories: v.array(repo_contribution_schema),
	daily_commits: v.array(
		v.object({ date: v.string(), count: v.number() }),
	),
	hourly_commits: v.array(
		v.object({ hour: v.number(), count: v.number() }),
	),
	reached_limit: v.boolean(),
	note: v.nullable(v.string()),
});

export const github_params_schema = v.object({
	username: v.pipe(v.string(), v.trim(), v.minLength(1)),
	since: v.pipe(v.string(), v.isoDate()),
	until: v.pipe(v.string(), v.isoDate()),
});

export type github_stats_result = v.InferOutput<
	typeof github_stats_schema
>;
export type github_params = v.InferInput<typeof github_params_schema>;

type github_commit_search_item = {
	repository: { full_name: string; html_url: string };
	commit: { author: { date: string } };
};

type github_commit_search_response = {
	items: github_commit_search_item[];
	total_count: number;
};

export async function get_github_stats_data(
	params: github_params,
): Promise<github_stats_result> {
	const { username, since, until } = v.parse(
		github_params_schema,
		params,
	);
	const github_token = env.GITHUB_TOKEN;

	if (!github_token)
		throw new Error('GITHUB_TOKEN is not configured.');

	const per_page = 100;
	let all_items: github_commit_search_item[] = [];
	let total_count = 0;
	let reached_limit = false;

	for (let page = 1; page <= 10; page++) {
		const api_url = `https://api.github.com/search/commits?q=author:${username}+author-date:${since}..${until}&sort=author-date&order=desc&per_page=${per_page}&page=${page}`;
		const response = await fetch(api_url, {
			headers: {
				Authorization: `Bearer ${github_token}`,
				Accept: 'application/vnd.github.v3+json',
				'X-GitHub-Api-Version': '2022-11-28',
				'User-Agent': 'sveltekit-github-stats',
			},
		});

		if (!response.ok) {
			if (response.status === 422) {
				reached_limit = true;
				break;
			}
			throw new Error(
				`Failed to fetch data from GitHub: ${response.status}`,
			);
		}

		const data =
			(await response.json()) as github_commit_search_response;
		all_items = all_items.concat(data.items);
		total_count = Math.min(data.total_count, 1000);

		if (data.items.length < per_page || all_items.length >= 1000) {
			reached_limit = all_items.length >= 1000;
			break;
		}
	}

	const repositories = Object.values(
		all_items.reduce<
			Record<string, v.InferOutput<typeof repo_contribution_schema>>
		>((acc, item) => {
			const name = item.repository.full_name;
			acc[name] ??= {
				name,
				url: item.repository.html_url,
				commits: 0,
				last_updated: item.commit.author.date,
			};
			acc[name].commits++;
			if (
				new Date(item.commit.author.date) >
				new Date(acc[name].last_updated)
			) {
				acc[name].last_updated = item.commit.author.date;
			}
			return acc;
		}, {}),
	).sort(
		(a, b) =>
			new Date(b.last_updated).getTime() -
			new Date(a.last_updated).getTime(),
	);

	const daily_counts = all_items.reduce<Record<string, number>>(
		(acc, item) => {
			const date = item.commit.author.date.split('T')[0];
			acc[date] = (acc[date] || 0) + 1;
			return acc;
		},
		{},
	);

	const hourly_counts = all_items.reduce<Record<number, number>>(
		(acc, item) => {
			const hour = new Date(item.commit.author.date).getUTCHours();
			acc[hour] = (acc[hour] || 0) + 1;
			return acc;
		},
		{},
	);

	return v.parse(github_stats_schema, {
		username,
		total_commits: total_count,
		since,
		until,
		repositories,
		daily_commits: Object.entries(daily_counts)
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => a.date.localeCompare(b.date)),
		hourly_commits: Array.from({ length: 24 }, (_, hour) => ({
			hour,
			count: hourly_counts[hour] || 0,
		})),
		reached_limit,
		note: reached_limit
			? 'Due to GitHub API limitations, only the first 1000 results are shown. The total commit count and repository list may be incomplete for large date ranges.'
			: null,
	});
}
