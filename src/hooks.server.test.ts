import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSessionUser } = vi.hoisted(() => ({
	getSessionUser: vi.fn().mockResolvedValue(null)
}));

vi.mock('$lib/server/auth/session', () => ({ getSessionUser }));
vi.mock('$lib/server/auth/token', () => ({ authenticateToken: vi.fn() }));

import { handle } from './hooks.server';

function createEvent(path: string, getClientAddress: () => string) {
	const url = new URL(path, 'https://img.potber.de');

	return {
		url,
		request: new Request(url),
		getClientAddress,
		cookies: {},
		locals: {}
	};
}

describe('server hook', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('does not require a client address for the health check', async () => {
		const getClientAddress = vi.fn(() => {
			throw new Error('forwarded client address header is missing');
		});
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		const response = await handle({
			event: createEvent('/up', getClientAddress) as never,
			resolve
		});

		expect(response.status).toBe(200);
		expect(getClientAddress).not.toHaveBeenCalled();
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('resolves the client address for rate-limited routes', async () => {
		const getClientAddress = vi.fn(() => '192.0.2.1');
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		const response = await handle({
			event: createEvent('/api/folders', getClientAddress) as never,
			resolve
		});

		expect(response.status).toBe(200);
		expect(getClientAddress).toHaveBeenCalledOnce();
	});
});
