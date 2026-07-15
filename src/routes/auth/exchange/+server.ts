import crypto from 'node:crypto';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TokenValidationError, validateToken } from '$lib/server/auth/oauth';
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

	const expectedStateBuffer = Buffer.from(expectedState, 'utf8');
	const stateBuffer = Buffer.from(state, 'utf8');
	if (
		expectedStateBuffer.length !== stateBuffer.length ||
		!crypto.timingSafeEqual(expectedStateBuffer, stateBuffer)
	) {
		error(403, { message: 'Invalid OAuth state' });
	}

	let session;
	try {
		session = await validateToken(accessToken);
	} catch (cause) {
		if (
			cause instanceof TokenValidationError &&
			(cause.upstreamStatus === 401 || cause.upstreamStatus === 403)
		) {
			error(401, { message: 'Invalid access token' });
		}

		console.error('OAuth token validation failed', cause);
		error(502, { message: 'Authentication service unavailable' });
	}

	try {
		const user = await createSession(cookies, {
			userId: session.userId,
			username: session.username,
			avatarUrl: session.avatarUrl
		});

		return json({ user: { id: user.id, username: user.username } });
	} catch (cause) {
		console.error('Failed to create imgpot session', cause);
		error(500, { message: 'Failed to create session' });
	}
};
