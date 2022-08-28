import { client } from '$lib/graphql/graphql-client';
import { GitHubUserData } from '$lib/graphql/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	console.log('=====================');
	console.log('GET', url.searchParams.get('user')?.toLocaleLowerCase().toString());
	console.log('=====================');

	const data = await client.request(GitHubUserData, { username: 'spences10' });

	console.log('=====================');
	console.log(data);
	console.log('=====================');

	const body = { hello: url };
	return new Response(JSON.stringify(body));
};
