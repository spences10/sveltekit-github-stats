import { GITHUB_GRAPHQL_TOKEN } from '$env/static/private';
import { PUBLIC_GRAPHQL_ENDPOINT } from '$env/static/public';
import { GraphQLClient } from 'graphql-request';

export const client = new GraphQLClient(PUBLIC_GRAPHQL_ENDPOINT, {
	headers: {
		authorization: `Bearer ${GITHUB_GRAPHQL_TOKEN}`
	}
});
