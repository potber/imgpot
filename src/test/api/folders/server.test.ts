import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEvent, createMockUser, expectHttpError } from '../../api-helpers';
import { mockDbChain } from '../../mock-db';

vi.mock('$lib/server/db', () => {
	const chain = mockDbChain();
	return {
		db: {
			select: vi.fn().mockReturnValue(chain),
			insert: vi.fn().mockReturnValue(chain),
			_chain: chain
		}
	};
});

import { db } from '$lib/server/db';
import { GET, POST } from '../../../routes/api/folders/+server';

const mockDb = db as any;

beforeEach(() => {
	vi.clearAllMocks();
	// Reset chain returns
	const chain = mockDbChain();
	mockDb.select.mockReturnValue(chain);
	mockDb.insert.mockReturnValue(chain);
	mockDb._chain = chain;
});

describe('GET /api/folders', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null });
		await expectHttpError(() => GET(event), 401);
	});

	it('returns empty array when no folders', async () => {
		const chain = mockDbChain([]);
		mockDb.select.mockReturnValue(chain);

		const event = createMockEvent();
		const response = await GET(event);
		const data = await response.json();

		expect(data.folders).toEqual([]);
	});

	it('returns user folders', async () => {
		const folders = [
			{ id: 1, name: 'Photos', slug: 'photos', userId: 1 },
			{ id: 2, name: 'Screenshots', slug: 'screenshots', userId: 1 }
		];
		const chain = mockDbChain(folders);
		mockDb.select.mockReturnValue(chain);

		const event = createMockEvent();
		const response = await GET(event);
		const data = await response.json();

		expect(data.folders).toEqual(folders);
	});
});

describe('POST /api/folders', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null, body: { name: 'test' } });
		await expectHttpError(() => POST(event), 401);
	});

	it('returns 400 for invalid JSON', async () => {
		const event = createMockEvent();
		event.request.json = async () => {
			throw new Error('Invalid JSON');
		};
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 when name is missing', async () => {
		const event = createMockEvent({ body: {} });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 when name is empty', async () => {
		const event = createMockEvent({ body: { name: '   ' } });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 when name is too long', async () => {
		const event = createMockEvent({ body: { name: 'a'.repeat(101) } });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 when slug is empty', async () => {
		const event = createMockEvent({ body: { name: '!!!@@@' } });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 201 on successful creation', async () => {
		const folder = { id: 1, name: 'Photos', slug: 'photos', userId: 1 };
		const chain = mockDbChain([folder]);
		mockDb.insert.mockReturnValue(chain);

		const event = createMockEvent({ body: { name: 'Photos' } });
		const response = await POST(event);

		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data).toEqual(folder);
	});

	it('trims whitespace from name', async () => {
		const folder = { id: 1, name: 'Photos', slug: 'photos', userId: 1 };
		const chain = mockDbChain([folder]);
		mockDb.insert.mockReturnValue(chain);

		const event = createMockEvent({ body: { name: '  Photos  ' } });
		await POST(event);

		expect(chain.values).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Photos' })
		);
	});

	it('returns 409 on duplicate folder', async () => {
		const chain = mockDbChain();
		chain.returning.mockImplementation(() => {
			const err: any = new Error('duplicate');
			err.code = '23505';
			throw err;
		});
		mockDb.insert.mockReturnValue(chain);

		const event = createMockEvent({ body: { name: 'Photos' } });
		await expectHttpError(() => POST(event), 409);
	});

	it('rethrows non-duplicate errors', async () => {
		const chain = mockDbChain();
		chain.returning.mockImplementation(() => {
			throw new Error('connection failed');
		});
		mockDb.insert.mockReturnValue(chain);

		const event = createMockEvent({ body: { name: 'Photos' } });
		await expect(POST(event)).rejects.toThrow('connection failed');
	});
});
