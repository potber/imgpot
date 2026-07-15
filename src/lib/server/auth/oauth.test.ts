import { afterEach, describe, expect, it, vi } from 'vitest';
import { TokenValidationError, validateToken } from './oauth';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('validateToken', () => {
	it('validates a bearer token with potber-api', async () => {
		const session = {
			userId: '123',
			username: 'alice',
			avatarUrl: null,
			cookie: 'session-cookie',
			iat: 1,
			exp: 2
		};
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify(session), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		await expect(validateToken('access-token')).resolves.toEqual(session);
		expect(fetchMock).toHaveBeenCalledWith('https://api.test/auth/session', {
			headers: { Authorization: 'Bearer access-token' }
		});
	});

	it('preserves an upstream authentication status', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

		await expect(validateToken('invalid-token')).rejects.toMatchObject({
			name: 'TokenValidationError',
			upstreamStatus: 401
		});
	});

	it('distinguishes an unreachable API from an invalid token', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')));

		await expect(validateToken('access-token')).rejects.toEqual(
			expect.objectContaining<TokenValidationError>({
				name: 'TokenValidationError',
				upstreamStatus: null
			})
		);
	});
});
