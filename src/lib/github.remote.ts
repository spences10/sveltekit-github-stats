import { query } from '$app/server';
import { GITHUB_TOKEN } from '$env/static/private';
import * as v from 'valibot';

const repo_contribution_schema = v.object({
	name: v.string(),
	url: v.string(),
	commits: v.number(),
	last_updated: v.string(), // Accept any string for datetime, will be validated by Date constructor
});

const github_stats_schema = v.object({
	username: v.string(),
	total_commits: v.number(),
	since: v.string(),
	until: v.string(),
	repositories: v.array(repo_contribution_schema),
	reached_limit: v.boolean(),
	note: v.nullable(v.string()),
});

const github_params_schema = v.object({
	username: v.pipe(v.string(), v.trim(), v.minLength(1)),
	since: v.pipe(v.string(), v.isoDate()),
	until: v.pipe(v.string(), v.isoDate()),
	timestamp: v.number(),
});

type repo_contribution = v.InferOutput<
	typeof repo_contribution_schema
>;
export type github_stats_result = v.InferOutput<
	typeof github_stats_schema
>;
export type github_params = v.InferInput<typeof github_params_schema>;

// Export the query function directly with validation schema
export const get_github_stats = query(
	github_params_schema,
	async (params: github_params): Promise<github_stats_result> => {
		const { username, since, until } = params;

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
					throw new Error(
						`Failed to fetch data from GitHub: ${response.status}`,
					);
				}

				const data = await response.json();
				all_items = all_items.concat(data.items);
				total_count = Math.min(data.total_count, 1000);

				if (
					data.items.length < per_page ||
					all_items.length >= 1000
				) {
					reached_limit = all_items.length >= 1000;
					break;
				}
			}

			const repo_contributions = all_items.reduce<
				Record<string, repo_contribution>
			>((acc, item) => {
				const repo_name = item.repository.full_name;
				if (!acc[repo_name]) {
					acc[repo_name] = {
						name: repo_name,
						url: item.repository.html_url,
						commits: 0,
						last_updated: item.commit.author.date,
					};
				}
				acc[repo_name].commits++;
				const current_date = new Date(acc[repo_name].last_updated);
				const new_date = new Date(item.commit.author.date);
				if (new_date > current_date) {
					acc[repo_name].last_updated = item.commit.author.date;
				}
				return acc;
			}, {});

			const sorted_repositories = Object.values(
				repo_contributions,
			).sort(
				(a: repo_contribution, b: repo_contribution) =>
					new Date(b.last_updated).getTime() -
					new Date(a.last_updated).getTime(),
			);

			const result: github_stats_result = {
				username,
				total_commits: total_count,
				since,
				until,
				repositories: sorted_repositories,
				reached_limit,
				note: reached_limit
					? 'Due to GitHub API limitations, only the first 1000 results are shown. The total commit count and repository list may be incomplete for large date ranges.'
					: null,
			};

			return v.parse(github_stats_schema, result);
		} catch (error) {
			console.error('Error fetching GitHub data:', error);
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('An error occurred while fetching data');
		}
	},
);
