import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { getSessionUser } from '$lib/server/auth/session';
import { authenticateToken } from '$lib/server/auth/token';
import { getAllowedCorsOrigin, parseAllowedOrigins } from '$lib/server/cors';
import { isAllowedFormOrigin, requiresFormOriginCheck } from '$lib/server/form-origin';
import { RateLimiter } from '$lib/server/rate-limit';

const authLimiter = new RateLimiter(10, 60 * 1000); // 10 requests/min per IP
const uploadLimiter = new RateLimiter(30, 60 * 1000); // 30 uploads/min per IP
const apiLimiter = new RateLimiter(120, 60 * 1000); // 120 requests/min per IP
const DEFAULT_ALLOWED_ORIGINS = [
	'http://localhost:4200',
	'https://potber.de',
	'https://test.potber.de',
	'https://*.potber.kristofdreier.de',
	'https://*.preview.potber.de'
];
const API_ALLOWED_ORIGINS = parseAllowedOrigins(
	env.CORS_ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(',')
);

function applyCorsHeaders(headers: Headers, origin: string) {
	headers.set('Access-Control-Allow-Origin', origin);
	headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
	headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
	headers.set('Vary', 'Origin');
}

function createForbiddenFormOriginResponse(request: Request): Response {
	const message = `Cross-site ${request.method} form submissions are forbidden`;
	const status = 403;

	if (request.headers.get('accept') === 'application/json') {
		return Response.json({ message }, { status });
	}

	return new Response(message, { status });
}

export const handle: Handle = async ({ event, resolve }) => {
	const ip = event.getClientAddress();
	const path = event.url.pathname;
	const isApiRoute = path.startsWith('/api/');
	const requestOrigin = event.request.headers.get('origin');
	const corsOrigin = isApiRoute ? getAllowedCorsOrigin(requestOrigin, API_ALLOWED_ORIGINS) : null;

	if (isApiRoute && event.request.method === 'OPTIONS') {
		if (!corsOrigin) {
			return new Response('Forbidden', { status: 403 });
		}

		const response = new Response(null, { status: 204 });
		applyCorsHeaders(response.headers, corsOrigin);
		return response;
	}

	if (
		requiresFormOriginCheck(event.request.method, event.request.headers.get('content-type')) &&
		!isAllowedFormOrigin(requestOrigin, event.url, isApiRoute, API_ALLOWED_ORIGINS)
	) {
		return createForbiddenFormOriginResponse(event.request);
	}

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

	if (corsOrigin) {
		applyCorsHeaders(response.headers, corsOrigin);
	}

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
	}

	return response;
};
