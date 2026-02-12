import { isHttpError } from '@sveltejs/kit';
import { expect } from 'vitest';

export function createMockUser(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		potberUserId: '12345',
		username: 'testuser',
		avatarUrl: null,
		...overrides
	};
}

export function createMockEvent(opts: {
	user?: ReturnType<typeof createMockUser> | null;
	params?: Record<string, string>;
	body?: unknown;
	formData?: FormData;
	searchParams?: Record<string, string>;
	cookies?: Record<string, unknown>;
} = {}) {
	const url = new URL('http://localhost');
	if (opts.searchParams) {
		for (const [key, value] of Object.entries(opts.searchParams)) {
			url.searchParams.set(key, value);
		}
	}

	const request: Record<string, unknown> = {
		json: async () => {
			if (opts.body === undefined) throw new Error('No body');
			return opts.body;
		},
		formData: async () => {
			if (!opts.formData) throw new Error('No formData');
			return opts.formData;
		}
	};

	const cookieStore = new Map<string, string>();
	const cookies = {
		get: (name: string) => cookieStore.get(name),
		set: (name: string, value: string) => cookieStore.set(name, value),
		delete: (name: string) => cookieStore.delete(name),
		...opts.cookies
	};

	return {
		locals: { user: opts.user === undefined ? createMockUser() : opts.user },
		params: opts.params || {},
		request,
		url,
		cookies
	} as any;
}

export async function expectHttpError(fn: () => Promise<unknown>, status: number) {
	try {
		await fn();
		expect.unreachable('Expected HttpError to be thrown');
	} catch (e) {
		expect(isHttpError(e)).toBe(true);
		expect((e as any).status).toBe(status);
		return e;
	}
}
