import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEvent, expectHttpError } from '../../api-helpers';
import { mockDbChain } from '../../mock-db';

vi.mock('$lib/server/bunny/storage', () => ({
	uploadFile: vi.fn().mockResolvedValue(undefined),
	deleteFile: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/server/bunny/cdn', () => ({
	buildCdnUrl: vi.fn((path: string) => `https://cdn.test/${path}`),
	generateStorageToken: vi.fn(() => 'mocktoken1')
}));

vi.mock('$lib/server/images/process', () => ({
	getImageMetadata: vi.fn().mockResolvedValue({
		width: 800,
		height: 600,
		sizeBytes: 50000,
		format: 'png'
	}),
	processImageVariations: vi.fn().mockResolvedValue([
		{
			type: 'large',
			buffer: Buffer.from('large'),
			width: 800,
			height: 600,
			sizeBytes: 40000,
			format: 'webp'
		},
		{
			type: 'small',
			buffer: Buffer.from('small'),
			width: 320,
			height: 240,
			sizeBytes: 10000,
			format: 'webp'
		}
	])
}));

vi.mock('$lib/server/db', () => {
	const chain = mockDbChain();
	return {
		db: {
			select: vi.fn().mockReturnValue(chain),
			insert: vi.fn().mockReturnValue(chain),
			transaction: vi.fn(),
			_chain: chain
		}
	};
});

import { db } from '$lib/server/db';
import { uploadFile, deleteFile } from '$lib/server/bunny/storage';
import { getImageMetadata, processImageVariations } from '$lib/server/images/process';
import { GET, POST } from '../../../routes/api/images/+server';

const mockDb = db as any;
const mockUploadFile = uploadFile as ReturnType<typeof vi.fn>;
const mockDeleteFile = deleteFile as ReturnType<typeof vi.fn>;
const mockGetImageMetadata = getImageMetadata as ReturnType<typeof vi.fn>;
const mockProcessImageVariations = processImageVariations as ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.clearAllMocks();
	const chain = mockDbChain();
	mockDb.select.mockReturnValue(chain);
	mockDb.insert.mockReturnValue(chain);

	// Reset mocks to defaults
	mockGetImageMetadata.mockResolvedValue({
		width: 800,
		height: 600,
		sizeBytes: 50000,
		format: 'png'
	});
	mockProcessImageVariations.mockResolvedValue([
		{
			type: 'large',
			buffer: Buffer.from('large'),
			width: 800,
			height: 600,
			sizeBytes: 40000,
			format: 'webp'
		},
		{
			type: 'small',
			buffer: Buffer.from('small'),
			width: 320,
			height: 240,
			sizeBytes: 10000,
			format: 'webp'
		}
	]);
});

function createFile(name = 'test.png', type = 'image/png', size = 1000) {
	const buffer = new ArrayBuffer(size);
	return new File([buffer], name, { type });
}

function createFormData(file?: File, folderId?: string) {
	const fd = new FormData();
	if (file) fd.set('file', file);
	if (folderId !== undefined) fd.set('folder_id', folderId);
	return fd;
}

describe('GET /api/images', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null });
		await expectHttpError(() => GET(event), 401);
	});

	it('uses default pagination', async () => {
		const imageList: any[] = [];
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain(imageList); // images
			// count query
			return mockDbChain([{ count: 0 }]);
		});

		const event = createMockEvent();
		const response = await GET(event);
		const data = await response.json();

		expect(data.page).toBe(1);
		expect(data.limit).toBe(20);
		expect(data.total).toBe(0);
		expect(data.images).toEqual([]);
	});

	it('respects custom page and limit', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([]);
			return mockDbChain([{ count: 0 }]);
		});

		const event = createMockEvent({ searchParams: { page: '3', limit: '10' } });
		const response = await GET(event);
		const data = await response.json();

		expect(data.page).toBe(3);
		expect(data.limit).toBe(10);
	});

	it('clamps page and limit bounds', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([]);
			return mockDbChain([{ count: 0 }]);
		});

		const event = createMockEvent({ searchParams: { page: '-5', limit: '500' } });
		const response = await GET(event);
		const data = await response.json();

		expect(data.page).toBe(1);
		expect(data.limit).toBe(100);
	});

	it('filters by folder_id', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([]);
			return mockDbChain([{ count: 0 }]);
		});

		const event = createMockEvent({ searchParams: { folder_id: '5' } });
		const response = await GET(event);
		const data = await response.json();

		expect(data.images).toEqual([]);
	});

	it('filters by unsorted', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([]);
			return mockDbChain([{ count: 0 }]);
		});

		const event = createMockEvent({ searchParams: { folder_id: 'unsorted' } });
		const response = await GET(event);
		const data = await response.json();

		expect(data.images).toEqual([]);
	});

	it('returns empty results', async () => {
		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain([]);
			return mockDbChain([{ count: 0 }]);
		});

		const event = createMockEvent();
		const response = await GET(event);
		const data = await response.json();

		expect(data.images).toEqual([]);
		expect(data.total).toBe(0);
	});

	it('maps variations to images', async () => {
		const imageList = [
			{ id: 1, userId: 1 },
			{ id: 2, userId: 1 }
		];
		const variations = [
			{ id: 10, imageId: 1, variationType: 'large' },
			{ id: 11, imageId: 1, variationType: 'small' },
			{ id: 12, imageId: 2, variationType: 'large' }
		];

		let callCount = 0;
		mockDb.select.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockDbChain(imageList);
			if (callCount === 2) return mockDbChain(variations);
			return mockDbChain([{ count: 2 }]);
		});

		const event = createMockEvent();
		const response = await GET(event);
		const data = await response.json();

		expect(data.images).toHaveLength(2);
		expect(data.images[0].variations).toHaveLength(2);
		expect(data.images[1].variations).toHaveLength(1);
	});
});

describe('POST /api/images', () => {
	it('returns 401 when not authenticated', async () => {
		const event = createMockEvent({ user: null, formData: createFormData(createFile()) });
		await expectHttpError(() => POST(event), 401);
	});

	it('returns 400 when no file', async () => {
		const event = createMockEvent({ formData: createFormData() });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 when file is empty', async () => {
		const file = createFile('test.png', 'image/png', 0);
		const event = createMockEvent({ formData: createFormData(file) });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 for unsupported type', async () => {
		const file = createFile('test.bmp', 'image/bmp', 1000);
		const event = createMockEvent({ formData: createFormData(file) });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 when file too large', async () => {
		const file = createFile('test.png', 'image/png', 21 * 1024 * 1024);
		const event = createMockEvent({ formData: createFormData(file) });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 for bad file name', async () => {
		const file = createFile('', 'image/png', 1000);
		const event = createMockEvent({ formData: createFormData(file) });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 for invalid folder_id', async () => {
		const file = createFile();
		const event = createMockEvent({ formData: createFormData(file, 'abc') });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 when folder not found', async () => {
		const selectChain = mockDbChain([]);
		mockDb.select.mockReturnValue(selectChain);

		const file = createFile();
		const event = createMockEvent({ formData: createFormData(file, '999') });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 for corrupt image', async () => {
		mockGetImageMetadata.mockRejectedValueOnce(new Error('corrupt'));

		const file = createFile();
		const event = createMockEvent({ formData: createFormData(file) });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 400 for oversized dimensions', async () => {
		mockGetImageMetadata.mockResolvedValueOnce({
			width: 10000,
			height: 10000,
			sizeBytes: 50000,
			format: 'png'
		});

		const file = createFile();
		const event = createMockEvent({ formData: createFormData(file) });
		await expectHttpError(() => POST(event), 400);
	});

	it('returns 201 on success', async () => {
		const imageRecord = {
			id: 1,
			userId: 1,
			folderId: null,
			originalFilename: 'test.png',
			storageToken: 'mocktoken1'
		};
		const variationRecords = [
			{ id: 1, imageId: 1, variationType: 'large' },
			{ id: 2, imageId: 1, variationType: 'small' }
		];

		mockDb.transaction.mockImplementation(async (fn: any) => {
			const tx = {
				insert: vi.fn().mockReturnValue(mockDbChain([imageRecord])),
				_insertCount: 0
			};
			// Second insert call returns variation records
			let insertCallCount = 0;
			tx.insert.mockImplementation(() => {
				insertCallCount++;
				if (insertCallCount === 1) return mockDbChain([imageRecord]);
				return mockDbChain([variationRecords[insertCallCount - 2]]);
			});
			return fn(tx);
		});

		const file = createFile();
		const event = createMockEvent({ formData: createFormData(file) });
		const response = await POST(event);

		expect(response.status).toBe(201);
		expect(mockUploadFile).toHaveBeenCalledTimes(2);
	});

	it('uploads without folder', async () => {
		const imageRecord = { id: 1, userId: 1, folderId: null };

		mockDb.transaction.mockImplementation(async (fn: any) => {
			let insertCallCount = 0;
			const tx = {
				insert: vi.fn().mockImplementation(() => {
					insertCallCount++;
					if (insertCallCount === 1) return mockDbChain([imageRecord]);
					return mockDbChain([{ id: insertCallCount }]);
				})
			};
			return fn(tx);
		});

		const file = createFile();
		const event = createMockEvent({ formData: createFormData(file) });
		const response = await POST(event);

		expect(response.status).toBe(201);
	});

	it('cleans up CDN files on upload failure', async () => {
		mockUploadFile
			.mockResolvedValueOnce(undefined) // first upload succeeds
			.mockRejectedValueOnce(new Error('CDN down')); // second fails

		const file = createFile();
		const event = createMockEvent({ formData: createFormData(file) });

		await expect(POST(event)).rejects.toThrow('CDN down');
		expect(mockDeleteFile).toHaveBeenCalledTimes(1);
	});
});
