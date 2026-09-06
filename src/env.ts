import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	GITHUB_TOKEN: { schema: v.optional(v.string()) },
});
