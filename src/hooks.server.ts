import type { Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const user = await getSessionUser(event.cookies);
	event.locals.user = user;
	event.locals.sessionId = user ? `${user.id}` : null;

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};
