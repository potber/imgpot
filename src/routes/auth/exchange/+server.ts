import crypto from 'node:crypto';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateToken } from '$lib/server/auth/oauth';
import { createSession } from '$lib/server/auth/session';

const OAUTH_STATE_COOKIE = 'oauth_state';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const { accessToken, state } = body;

	if (!accessToken || typeof accessToken !== 'string') {
		error(400, { message: 'Missing access token' });
	}

	// Verify OAuth state to prevent login CSRF
	const expectedState = cookies.get(OAUTH_STATE_COOKIE);
	cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

	if (!expectedState || !state || typeof state !== 'string') {
		error(403, { message: 'Missing OAuth state' });
	}

	if (
		!crypto.timingSafeEqual(Buffer.from(expectedState, 'utf8'), Buffer.from(state, 'utf8'))
	) {
		error(403, { message: 'Invalid OAuth state' });
	}

	try {
		const session = await validateToken(accessToken);

		const user = await createSession(cookies, {
			userId: session.userId,
			username: session.username,
			avatarUrl: session.avatarUrl
		});

		return json({ user: { id: user.id, username: user.username } });
	} catch (e) {
		console.error('Token validation error:', e);
		error(401, { message: 'Invalid access token' });
	}
};
