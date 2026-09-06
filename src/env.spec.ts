import { expect, it } from 'vitest';
import * as v from 'valibot';
import { variables } from './env.js';

it('allows the app to start without a GitHub token', () => {
	expect(
		v.safeParse(variables.GITHUB_TOKEN.schema, undefined).success,
	).toBe(true);
});
