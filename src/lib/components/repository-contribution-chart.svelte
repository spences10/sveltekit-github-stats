<script lang="ts">
	import type { github_stats_result } from '$lib/github.remote';
	import { Chevron } from '$lib/icons';

	let { stats } = $props<{ stats: github_stats_result }>();

	let sort_order: 'desc' | 'asc' = $state('desc'); // Default to highest first

	// Create repository contribution bars (all repos)
	const repo_data = $derived(() => {
		const all_repos = stats.repositories;
		const max_commits = Math.max(
			...all_repos.map((repo: { commits: number }) => repo.commits),
			1,
		);

		const mapped_repos = all_repos.map(
			(repo: { name: string; commits: number; url: string }) => ({
				name: repo.name.split('/').pop() || repo.name,
				full_name: repo.name,
				commits: repo.commits,
				percentage: (repo.commits / max_commits) * 100,
				url: repo.url,
			}),
		);

		// Sort by commits based on sort_order
		return mapped_repos.sort(
			(a: { commits: number }, b: { commits: number }) =>
				sort_order === 'desc'
					? b.commits - a.commits
					: a.commits - b.commits,
		);
	});

	const get_bar_color = (commits: number, max_commits: number) => {
		const percentage = (commits / max_commits) * 100;
		if (percentage >= 80) return 'bg-success';
		if (percentage >= 60) return 'bg-info';
		if (percentage >= 40) return 'bg-warning';
		return 'bg-error/60';
	};

	const toggle_sort = () => {
		sort_order = sort_order === 'desc' ? 'asc' : 'desc';
	};
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="flex items-center justify-between">
			<h3 class="card-title">
				<span class="text-primary">📊</span>
				Repository Contributions
			</h3>
			<button
				class="btn btn-ghost btn-sm"
				onclick={toggle_sort}
				title={sort_order === 'desc'
					? 'Sort ascending'
					: 'Sort descending'}
			>
				<Chevron
					height="16px"
					width="16px"
					rotated={sort_order === 'desc'}
				/>
			</button>
		</div>

		<div class="mt-4 space-y-3">
			{#each repo_data() as repo}
				<div class="space-y-1">
					<div class="flex items-center justify-between">
						<a
							href={repo.url}
							target="_blank"
							rel="noopener noreferrer"
							class="max-w-[60%] truncate text-sm font-medium transition-colors hover:text-primary"
							title={repo.full_name}
						>
							{repo.name}
						</a>
						<span class="text-xs text-base-content/60">
							{repo.commits} commit{repo.commits !== 1 ? 's' : ''}
						</span>
					</div>
					<div class="h-2 w-full rounded-full bg-base-200">
						<div
							class="h-2 rounded-full transition-all duration-300 {get_bar_color(
								repo.commits,
								repo_data()[0]?.commits || 1,
							)}"
							style="width: {repo.percentage}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
