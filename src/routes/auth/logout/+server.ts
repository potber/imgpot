import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { destroySession } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	destroySession(cookies);
	redirect(302, '/auth/login');
};
