import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEvent, expectHttpError } from '../../api-helpers';
import { mockDbChain } from '../../mock-db';

vi.mock('$lib/server/bunny/storage', () => ({
	deleteFile: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/server/auth/session', () => ({
	destroySession: vi.fn()
}));

vi.mock('$lib/server/db', () => {
	const chain = mockDbChain();
	return {
		db: {
			select: vi.fn().mockReturnValue(chain),
			delete: vi.fn().mockReturnValue(chain),
			transaction: vi.fn(),
			_chain: chain
		}
	};
});

import { db } from '$lib/server/db';
import { deleteFile } from '$lib/server/bunny/storage';
import { destroySession } from '$lib/server/auth/session';
import { DELETE } from '../../../routes/api/account/+server';

const mockDb = db as any;
const mockDeleteFile = deleteFile as ReturnType<typeof vi.fn>;
const mockDestroySession = destroySession as ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.clearAllMocks();
	const chain = mockDbChain();
	mockDb.select.mockReturnValue(chain);
	mockDb.delete.mockReturnValue(chain);
});

describe('DELETE /api/account', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null });
		await expectHttpError(() => DELETE(event), 401);
	});

	it('handles empty account (no images)', async () => {
		// First select: user images (empty)
		const selectChain = mockDbChain([]);
		mockDb.select.mockReturnValue(selectChain);

		mockDb.transaction.mockImplementation(async (fn: any) => {
			const tx = {
				delete: vi.fn().mockReturnValue(mockDbChain())
			};
			return fn(tx);
		});

		const event = createMockEvent();
		const response = await DELETE(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
		expect(mockDestroySession).toHaveBeenCalledWith(event.cookies);
		expect(mockDeleteFile).not.toHaveBeenCalled();
	});

	it('performs full cleanup with images', async () => {
		const userImages = [{ id: 1 }, { id: 2 }];
		const variations = [
			{ storageFilename: 'token1l.webp' },
			{ storageFilename: 'token1s.webp' },
			{ storageFilename: 'token2l.webp' }
		];

		let selectCount = 0;
		mockDb.select.mockImplementation(() => {
			selectCount++;
			if (selectCount === 1) return mockDbChain(userImages);
			return mockDbChain(variations);
		});

		mockDb.transaction.mockImplementation(async (fn: any) => {
			const tx = {
				delete: vi.fn().mockReturnValue(mockDbChain())
			};
			return fn(tx);
		});

		const event = createMockEvent();
		const response = await DELETE(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
		expect(mockDeleteFile).toHaveBeenCalledTimes(3);
		expect(mockDeleteFile).toHaveBeenCalledWith('token1l.webp');
		expect(mockDeleteFile).toHaveBeenCalledWith('token1s.webp');
		expect(mockDeleteFile).toHaveBeenCalledWith('token2l.webp');
		expect(mockDestroySession).toHaveBeenCalled();
	});

	it('tolerates CDN delete failures', async () => {
		const userImages = [{ id: 1 }];
		const variations = [{ storageFilename: 'token1l.webp' }];

		let selectCount = 0;
		mockDb.select.mockImplementation(() => {
			selectCount++;
			if (selectCount === 1) return mockDbChain(userImages);
			return mockDbChain(variations);
		});

		mockDb.transaction.mockImplementation(async (fn: any) => {
			const tx = {
				delete: vi.fn().mockReturnValue(mockDbChain())
			};
			return fn(tx);
		});

		mockDeleteFile.mockRejectedValueOnce(new Error('CDN error'));

		const event = createMockEvent();
		const response = await DELETE(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
		expect(mockDestroySession).toHaveBeenCalled();
	});

	it('destroys session after cleanup', async () => {
		const selectChain = mockDbChain([]);
		mockDb.select.mockReturnValue(selectChain);

		mockDb.transaction.mockImplementation(async (fn: any) => {
			const tx = {
				delete: vi.fn().mockReturnValue(mockDbChain())
			};
			return fn(tx);
		});

		const event = createMockEvent();
		await DELETE(event);

		expect(mockDestroySession).toHaveBeenCalledWith(event.cookies);
	});
});
