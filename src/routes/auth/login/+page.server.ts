import crypto from 'node:crypto';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import { buildAuthorizationUrl } from '$lib/server/auth/oauth';

const OAUTH_STATE_COOKIE = 'oauth_state';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	const state = crypto.randomBytes(16).toString('hex');
	cookies.set(OAUTH_STATE_COOKIE, state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 10 * 60 // 10 minutes
	});

	const redirectUri = `${url.origin}/auth/callback`;
	const authUrl = buildAuthorizationUrl(redirectUri, state);

	return { authUrl, state };
};
