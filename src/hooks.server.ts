import type { Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth/session';
import { authenticateToken } from '$lib/server/auth/token';

export const handle: Handle = async ({ event, resolve }) => {
	let user = await getSessionUser(event.cookies);

	if (!user) {
		const auth = event.request.headers.get('Authorization');
		if (auth?.startsWith('Bearer ')) {
			const token = auth.slice(7);
			try {
				user = await authenticateToken(token);
			} catch {
				// invalid/expired token — user stays null, routes will return 401
			}
		}
	}

	event.locals.user = user;
	event.locals.sessionId = user ? `${user.id}` : null;

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};
