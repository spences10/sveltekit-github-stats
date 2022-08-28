import { client } from '$lib/graphql/graphql-client';
import { GitHubUserData } from '$lib/graphql/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	// console.log('=====================');
	// console.log(`server`, url);
	// console.log('=====================');
	const username = url.searchParams.get('user')?.toLocaleLowerCase().toString();

	const data = await client.request(GitHubUserData, { username });

	// console.log('=====================');
	// console.log(data);
	// console.log('=====================');

	return new Response(JSON.stringify(data, null, 2));
};
