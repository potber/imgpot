import { describe, expect, it } from 'vitest';
import { getClipboardImageFiles, isValidImageType, type ClipboardItemLike } from './file';

function clipboardItem(types: string[], blobs: Record<string, Blob>): ClipboardItemLike {
	return {
		types,
		getType: async (type) => blobs[type]
	};
}

describe('image file utilities', () => {
	it('recognizes supported upload types', () => {
		expect(isValidImageType('image/png')).toBe(true);
		expect(isValidImageType('image/jpeg')).toBe(true);
		expect(isValidImageType('image/tiff')).toBe(false);
	});

	it('turns supported clipboard images into named files', async () => {
		const png = new Blob(['png'], { type: 'image/png' });
		const jpeg = new Blob(['jpeg'], { type: 'image/jpeg' });
		const items = [
			clipboardItem(['text/plain', 'image/png'], { 'image/png': png }),
			clipboardItem(['image/tiff'], { 'image/tiff': new Blob(['tiff']) }),
			clipboardItem(['image/jpeg'], { 'image/jpeg': jpeg })
		];

		const files = await getClipboardImageFiles(items, 1234);

		expect(files).toHaveLength(2);
		expect(files[0]).toMatchObject({ name: 'clipboard-1234-1.png', type: 'image/png' });
		expect(files[1]).toMatchObject({ name: 'clipboard-1234-2.jpg', type: 'image/jpeg' });
	});
});
