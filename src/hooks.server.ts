import type { Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const user = await getSessionUser(event.cookies);
	event.locals.user = user;
	event.locals.sessionId = user ? `${user.id}` : null;

	return resolve(event);
};
