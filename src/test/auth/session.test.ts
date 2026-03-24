import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	dev: true
}));

vi.mock('$lib/server/env', () => ({
	getEnv: vi.fn(() => '0123456789abcdef0123456789abcdef'),
	getOptionalEnv: vi.fn(() => undefined)
}));

const { mockDb } = vi.hoisted(() => ({
	mockDb: {
		select: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn(),
		update: vi.fn(),
		transaction: vi.fn()
	}
}));

vi.mock('$lib/server/db', () => ({
	db: mockDb
}));

import { createSession, destroySession, getSessionUser } from '$lib/server/auth/session';

function createSelectChain(result: unknown[], withInnerJoin = false) {
	const chain: Record<string, unknown> = {
		from: vi.fn(() => chain),
		where: vi.fn(() => chain),
		limit: vi.fn().mockResolvedValue(result)
	};

	if (withInnerJoin) {
		chain.innerJoin = vi.fn(() => chain);
	}

	return chain;
}

function createInsertChain(result: unknown[]) {
	const chain: Record<string, unknown> = {
		values: vi.fn(() => chain),
		returning: vi.fn().mockResolvedValue(result)
	};

	return chain;
}

function createDeleteChain() {
	return {
		where: vi.fn().mockResolvedValue(undefined)
	};
}

function createCookies(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));

	return {
		store,
		cookies: {
			get: vi.fn((name: string) => store.get(name)),
			set: vi.fn((name: string, value: string, _options?: unknown) => {
				store.set(name, value);
			}),
			delete: vi.fn((name: string, _options?: unknown) => {
				store.delete(name);
			})
		}
	};
}

describe('session auth', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates opaque, server-backed sessions', async () => {
		const createdUser = {
			id: 7,
			potberUserId: '12345',
			username: 'alice',
			avatarUrl: null
		};
		const cookies = createCookies();
		const selectChain = createSelectChain([]);
		const insertChain = createInsertChain([createdUser]);
		const txDeleteChain = createDeleteChain();
		const tx = {
			delete: vi.fn(() => txDeleteChain),
			insert: vi.fn(() => ({
				values: vi.fn().mockResolvedValue(undefined)
			}))
		};

		mockDb.select.mockReturnValue(selectChain);
		mockDb.insert.mockReturnValue(insertChain);
		mockDb.transaction.mockImplementation(async (callback: (tx: any) => Promise<void>) =>
			callback(tx)
		);

		const user = await createSession(cookies.cookies as any, {
			userId: '12345',
			username: 'alice',
			avatarUrl: null
		});

		const [[cookieName, cookieValue, cookieOptions]] = cookies.cookies.set.mock.calls;

		expect(user).toEqual(createdUser);
		expect(cookieName).toBe('session');
		expect(cookieValue).toEqual(expect.any(String));
		expect(cookieValue).not.toBe(String(createdUser.id));
		expect(cookieOptions).toMatchObject({
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			path: '/'
		});
		expect(tx.delete).toHaveBeenCalled();
		expect(tx.insert).toHaveBeenCalled();
	});

	it('looks up the user through the session table', async () => {
		const cookies = createCookies({ session: 'opaque-session-token' });
		const selectChain = createSelectChain(
			[
				{
					id: 7,
					potberUserId: '12345',
					username: 'alice',
					avatarUrl: null
				}
			],
			true
		);

		mockDb.select.mockReturnValue(selectChain);

		const user = await getSessionUser(cookies.cookies as any);

		expect(user).toEqual({
			id: 7,
			potberUserId: '12345',
			username: 'alice',
			avatarUrl: null
		});
		expect(cookies.cookies.delete).not.toHaveBeenCalled();
	});

	it('revokes the stored session on logout', async () => {
		const cookies = createCookies({ session: 'opaque-session-token' });
		const deleteChain = createDeleteChain();

		mockDb.delete.mockReturnValue(deleteChain);

		await destroySession(cookies.cookies as any);

		expect(mockDb.delete).toHaveBeenCalled();
		expect(deleteChain.where).toHaveBeenCalled();
		expect(cookies.cookies.delete).toHaveBeenCalledWith('session', { path: '/' });
	});
});
