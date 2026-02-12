import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { processImageVariations, getImageMetadata } from './process';

async function createTestImage(width: number, height: number): Promise<Buffer> {
	return sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 255, g: 0, b: 0 }
		}
	})
		.png()
		.toBuffer();
}

describe('getImageMetadata', () => {
	it('returns correct dimensions and size', async () => {
		const buffer = await createTestImage(800, 600);
		const meta = await getImageMetadata(buffer);
		expect(meta.width).toBe(800);
		expect(meta.height).toBe(600);
		expect(meta.sizeBytes).toBeGreaterThan(0);
	});
});

describe('processImageVariations', () => {
	it('produces 3 WebP variations from a large image', async () => {
		const buffer = await createTestImage(2000, 1500);
		const variations = await processImageVariations(buffer);

		expect(variations).toHaveLength(3);
		expect(variations.map((v) => v.type)).toEqual(['large', 'medium', 'small']);
		variations.forEach((v) => {
			expect(v.format).toBe('webp');
			expect(v.sizeBytes).toBeGreaterThan(0);
		});
	});

	it('resizes large variation to max 1600px width', async () => {
		const buffer = await createTestImage(2000, 1500);
		const variations = await processImageVariations(buffer);

		const large = variations.find((v) => v.type === 'large')!;
		expect(large.width).toBe(1600);
		expect(large.height).toBe(1200);
	});

	it('resizes medium variation to max 800px width', async () => {
		const buffer = await createTestImage(2000, 1500);
		const variations = await processImageVariations(buffer);

		const medium = variations.find((v) => v.type === 'medium')!;
		expect(medium.width).toBe(800);
		expect(medium.height).toBe(600);
	});

	it('resizes small variation to max 320px width', async () => {
		const buffer = await createTestImage(2000, 1500);
		const variations = await processImageVariations(buffer);

		const small = variations.find((v) => v.type === 'small')!;
		expect(small.width).toBe(320);
		expect(small.height).toBe(240);
	});

	it('keeps original as large and downscales where possible', async () => {
		const buffer = await createTestImage(600, 450);
		const variations = await processImageVariations(buffer);

		// 600px fits within large (1600), so original is kept as "large"
		// 600px > small (320), so a downscaled "small" is also produced
		expect(variations).toHaveLength(2);
		expect(variations.map((v) => v.type)).toEqual(['large', 'small']);
		expect(variations[0].width).toBe(600);
		expect(variations[1].width).toBe(320);
	});

	it('keeps original as large for tiny images', async () => {
		const buffer = await createTestImage(200, 150);
		const variations = await processImageVariations(buffer);

		// Image is smaller than all thresholds, kept as "large" at original size
		expect(variations).toHaveLength(1);
		expect(variations[0].type).toBe('large');
		expect(variations[0].width).toBe(200);
		expect(variations[0].height).toBe(150);
	});
});
