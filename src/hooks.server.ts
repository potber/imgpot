import type { Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth/session';
import { authenticateToken } from '$lib/server/auth/token';
import { RateLimiter } from '$lib/server/rate-limit';

const authLimiter = new RateLimiter(10, 60 * 1000); // 10 requests/min per IP
const uploadLimiter = new RateLimiter(30, 60 * 1000); // 30 uploads/min per IP
const apiLimiter = new RateLimiter(120, 60 * 1000); // 120 requests/min per IP

export const handle: Handle = async ({ event, resolve }) => {
	const ip = event.getClientAddress();
	const path = event.url.pathname;

	// Rate limiting
	if (path.startsWith('/auth/')) {
		if (!authLimiter.check(ip)) {
			return new Response('Too many requests', { status: 429 });
		}
	} else if (path.startsWith('/api/')) {
		const isUpload = path === '/api/images' && event.request.method === 'POST';
		const limiter = isUpload ? uploadLimiter : apiLimiter;
		if (!limiter.check(ip)) {
			return new Response('Too many requests', { status: 429 });
		}
	}

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
