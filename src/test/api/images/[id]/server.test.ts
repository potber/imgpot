import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEvent, expectHttpError } from '../../../api-helpers';
import { mockDbChain } from '../../../mock-db';

vi.mock('$lib/server/bunny/storage', () => ({
	deleteFile: vi.fn().mockResolvedValue(undefined)
}));

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
import { deleteFile } from '$lib/server/bunny/storage';
import { GET, PATCH, DELETE } from '../../../../routes/api/images/[id]/+server';

const mockDb = db as any;
const mockDeleteFile = deleteFile as ReturnType<typeof vi.fn>;

function resetChains() {
	const chain = mockDbChain();
	mockDb.select.mockReturnValue(chain);
	mockDb.update.mockReturnValue(chain);
	mockDb.delete.mockReturnValue(chain);
}

beforeEach(() => {
	vi.clearAllMocks();
	resetChains();
});

const mockImage = {
	id: 1,
	userId: 1,
	folderId: null,
	originalFilename: 'test.png',
	mimeType: 'image/png',
	originalWidth: 800,
	originalHeight: 600,
	originalSizeBytes: 50000,
	storageToken: 'abc123',
	storagePath: 'abc123'
};

const mockVariations = [
	{
		id: 1,
		imageId: 1,
		variationType: 'large',
		width: 800,
		height: 600,
		sizeBytes: 40000,
		format: 'webp',
		storageFilename: 'abc123l.webp',
		cdnUrl: 'https://cdn.test/abc123l.webp'
	},
	{
		id: 2,
		imageId: 1,
		variationType: 'small',
		width: 320,
		height: 240,
		sizeBytes: 10000,
		format: 'webp',
		storageFilename: 'abc123s.webp',
		cdnUrl: 'https://cdn.test/abc123s.webp'
	}
];

describe('GET /api/images/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null, params: { id: '1' } });
		await expectHttpError(() => GET(event), 401);
	});

	it('returns 400 for invalid id', async () => {
		const event = createMockEvent({ params: { id: 'abc' } });
		await expectHttpError(() => GET(event), 400);
	});

	it('returns 404 when image not found', async () => {
		const selectChain = mockDbChain([]);
		mockDb.select.mockReturnValue(selectChain);

		const event = createMockEvent({ params: { id: '99' } });
		await expectHttpError(() => GET(event), 404);
	});

	it('returns image with variations', async () => {
		// First select returns the image, second returns variations
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([mockImage]);
			return mockDbChain(mockVariations);
		});

		const event = createMockEvent({ params: { id: '1' } });
		const response = await GET(event);
		const data = await response.json();

		expect(data.id).toBe(1);
		expect(data.variations).toEqual(mockVariations);
	});
});

describe('PATCH /api/images/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null, params: { id: '1' }, body: { folderId: 1 } });
		await expectHttpError(() => PATCH(event), 401);
	});

	it('returns 400 for invalid id', async () => {
		const event = createMockEvent({ params: { id: 'abc' }, body: { folderId: 1 } });
		await expectHttpError(() => PATCH(event), 400);
	});

	it('returns 400 for invalid JSON', async () => {
		const event = createMockEvent({ params: { id: '1' } });
		event.request.json = async () => {
			throw new Error('bad json');
		};
		await expectHttpError(() => PATCH(event), 400);
	});

	it('returns 404 when image not found', async () => {
		const selectChain = mockDbChain([]);
		mockDb.select.mockReturnValue(selectChain);

		const event = createMockEvent({ params: { id: '1' }, body: { folderId: 2 } });
		await expectHttpError(() => PATCH(event), 404);
	});

	it('returns 400 when folder not found', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([mockImage]);
			return mockDbChain([]); // folder not found
		});

		const event = createMockEvent({ params: { id: '1' }, body: { folderId: 999 } });
		await expectHttpError(() => PATCH(event), 400);
	});

	it('moves image to folder on success', async () => {
		const folder = { id: 2 };
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([mockImage]);
			return mockDbChain([folder]);
		});

		const updateChain = mockDbChain();
		mockDb.update.mockReturnValue(updateChain);

		const event = createMockEvent({ params: { id: '1' }, body: { folderId: 2 } });
		const response = await PATCH(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
		expect(mockDb.update).toHaveBeenCalled();
	});

	it('unsorts image with null folderId', async () => {
		const selectChain = mockDbChain([mockImage]);
		mockDb.select.mockReturnValue(selectChain);

		const updateChain = mockDbChain();
		mockDb.update.mockReturnValue(updateChain);

		const event = createMockEvent({ params: { id: '1' }, body: { folderId: null } });
		const response = await PATCH(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
	});

	it('unsorts image with undefined folderId', async () => {
		const selectChain = mockDbChain([mockImage]);
		mockDb.select.mockReturnValue(selectChain);

		const updateChain = mockDbChain();
		mockDb.update.mockReturnValue(updateChain);

		const event = createMockEvent({ params: { id: '1' }, body: { folderId: undefined } });
		const response = await PATCH(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
	});
});

describe('DELETE /api/images/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null, params: { id: '1' } });
		await expectHttpError(() => DELETE(event), 401);
	});

	it('returns 400 for invalid id', async () => {
		const event = createMockEvent({ params: { id: 'abc' } });
		await expectHttpError(() => DELETE(event), 400);
	});

	it('returns 404 when image not found', async () => {
		const selectChain = mockDbChain([]);
		mockDb.select.mockReturnValue(selectChain);

		const event = createMockEvent({ params: { id: '99' } });
		await expectHttpError(() => DELETE(event), 404);
	});

	it('deletes CDN files and DB record', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([mockImage]);
			return mockDbChain(mockVariations.map((v) => ({ storageFilename: v.storageFilename })));
		});

		const deleteChain = mockDbChain();
		mockDb.delete.mockReturnValue(deleteChain);

		const event = createMockEvent({ params: { id: '1' } });
		const response = await DELETE(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
		expect(mockDeleteFile).toHaveBeenCalledTimes(2);
		expect(mockDeleteFile).toHaveBeenCalledWith('abc123l.webp');
		expect(mockDeleteFile).toHaveBeenCalledWith('abc123s.webp');
		expect(mockDb.delete).toHaveBeenCalled();
	});

	it('continues when CDN delete fails', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([mockImage]);
			return mockDbChain([{ storageFilename: 'abc123l.webp' }]);
		});

		mockDeleteFile.mockRejectedValueOnce(new Error('CDN error'));

		const deleteChain = mockDbChain();
		mockDb.delete.mockReturnValue(deleteChain);

		const event = createMockEvent({ params: { id: '1' } });
		const response = await DELETE(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
	});

	it('handles image with no variations', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([mockImage]);
			return mockDbChain([]);
		});

		const deleteChain = mockDbChain();
		mockDb.delete.mockReturnValue(deleteChain);

		const event = createMockEvent({ params: { id: '1' } });
		const response = await DELETE(event);
		const data = await response.json();

		expect(data).toEqual({ success: true });
		expect(mockDeleteFile).not.toHaveBeenCalled();
	});
});
