import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateToken } from '$lib/server/auth/oauth';
import { createSession } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const { accessToken } = body;

	if (!accessToken || typeof accessToken !== 'string') {
		error(400, { message: 'Missing access token' });
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
