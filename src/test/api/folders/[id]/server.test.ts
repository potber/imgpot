import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEvent, expectHttpError } from '../../../api-helpers';
import { mockDbChain } from '../../../mock-db';

vi.mock('$lib/server/db', () => {
	const chain = mockDbChain();
	return {
		db: {
			select: vi.fn().mockReturnValue(chain),
			update: vi.fn().mockReturnValue(chain),
			delete: vi.fn().mockReturnValue(chain),
			_chain: chain
		}
	};
});

import { db } from '$lib/server/db';
import { PATCH, DELETE } from '../../../../routes/api/folders/[id]/+server';

const mockDb = db as any;

function resetChains() {
	const chain = mockDbChain();
	mockDb.select.mockReturnValue(chain);
	mockDb.update.mockReturnValue(chain);
	mockDb.delete.mockReturnValue(chain);
	return chain;
}

beforeEach(() => {
	vi.clearAllMocks();
	resetChains();
});

describe('PATCH /api/folders/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null, params: { id: '1' }, body: { name: 'x' } });
		await expectHttpError(() => PATCH(event), 401);
	});

	it('returns 400 for invalid id', async () => {
		const event = createMockEvent({ params: { id: 'abc' }, body: { name: 'x' } });
		await expectHttpError(() => PATCH(event), 400);
	});

	it('returns 400 for invalid JSON', async () => {
		const event = createMockEvent({ params: { id: '1' } });
		event.request.json = async () => {
			throw new Error('bad json');
		};
		await expectHttpError(() => PATCH(event), 400);
	});

	it('returns 400 when name is missing', async () => {
		const event = createMockEvent({ params: { id: '1' }, body: {} });
		await expectHttpError(() => PATCH(event), 400);
	});

	it('returns 404 when folder not found', async () => {
		const selectChain = mockDbChain([]);
		mockDb.select.mockReturnValue(selectChain);

		const event = createMockEvent({ params: { id: '1' }, body: { name: 'Updated' } });
		await expectHttpError(() => PATCH(event), 404);
	});

	it('returns updated folder on success', async () => {
		const folder = { id: 1, name: 'Old', slug: 'old', userId: 1 };
		const updated = { id: 1, name: 'New', slug: 'new', userId: 1 };

		const selectChain = mockDbChain([folder]);
		mockDb.select.mockReturnValue(selectChain);

		const updateChain = mockDbChain([updated]);
		mockDb.update.mockReturnValue(updateChain);

		const event = createMockEvent({ params: { id: '1' }, body: { name: 'New' } });
		const response = await PATCH(event);
		const data = await response.json();

		expect(data).toEqual(updated);
	});

	it('returns 409 on duplicate name', async () => {
		const folder = { id: 1, name: 'Old', slug: 'old', userId: 1 };
		const selectChain = mockDbChain([folder]);
		mockDb.select.mockReturnValue(selectChain);

		const updateChain = mockDbChain();
		updateChain.returning.mockImplementation(() => {
			const err: any = new Error('duplicate');
			err.code = '23505';
			throw err;
		});
		mockDb.update.mockReturnValue(updateChain);

		const event = createMockEvent({ params: { id: '1' }, body: { name: 'Existing' } });
		await expectHttpError(() => PATCH(event), 409);
	});
});

describe('DELETE /api/folders/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null, params: { id: '1' } });
		await expectHttpError(() => DELETE(event), 401);
	});

	it('returns 400 for invalid id', async () => {
		const event = createMockEvent({ params: { id: 'abc' } });
		await expectHttpError(() => DELETE(event), 400);
	});

	it('returns 404 when folder not found', async () => {
		const selectChain = mockDbChain([]);
		mockDb.select.mockReturnValue(selectChain);

		const event = createMockEvent({ params: { id: '1' } });
		await expectHttpError(() => DELETE(event), 404);
	});

	it('unsets folder on images and deletes folder', async () => {
		const folder = { id: 1, name: 'Photos', slug: 'photos', userId: 1 };
		const selectChain = mockDbChain([folder]);
		mockDb.select.mockReturnValue(selectChain);

		const updateChain = mockDbChain();
		mockDb.update.mockReturnValue(updateChain);

		const deleteChain = mockDbChain();
		mockDb.delete.mockReturnValue(deleteChain);

		const event = createMockEvent({ params: { id: '1' } });
		const response = await DELETE(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
		expect(mockDb.update).toHaveBeenCalled();
		expect(mockDb.delete).toHaveBeenCalled();
	});
});
