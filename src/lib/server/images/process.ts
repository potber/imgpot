import sharp from 'sharp';
import { VARIATION_CONFIGS, type ProcessedVariation } from './variations';

export interface ImageMetadata {
	width: number;
	height: number;
	sizeBytes: number;
}

export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
	const metadata = await sharp(buffer).metadata();
	if (!metadata.width || !metadata.height) {
		throw new Error('Could not read image dimensions');
	}
	return {
		width: metadata.width,
		height: metadata.height,
		sizeBytes: buffer.length
	};
}

export async function processImageVariations(
	inputBuffer: Buffer
): Promise<ProcessedVariation[]> {
	const metadata = await sharp(inputBuffer).metadata();
	if (!metadata.width || !metadata.height) {
		throw new Error('Could not read image dimensions');
	}

	const originalWidth = metadata.width;
	const originalHeight = metadata.height;

	const results: ProcessedVariation[] = [];

	for (const config of VARIATION_CONFIGS) {
		// Skip variations that would require upscaling
		if (originalWidth <= config.maxWidth) continue;

		const outputBuffer = await sharp(inputBuffer)
			.resize(config.maxWidth, undefined, { withoutEnlargement: true })
			.webp({ quality: config.quality })
			.toBuffer();
		const outputMeta = await sharp(outputBuffer).metadata();

		results.push({
			type: config.type,
			buffer: outputBuffer,
			width: outputMeta.width!,
			height: outputMeta.height!,
			sizeBytes: outputBuffer.length,
			format: 'webp'
		});
	}

	// Always produce at least one variation (the smallest that fits)
	if (results.length === 0) {
		const outputBuffer = await sharp(inputBuffer)
			.webp({ quality: VARIATION_CONFIGS[VARIATION_CONFIGS.length - 1].quality })
			.toBuffer();
		const outputMeta = await sharp(outputBuffer).metadata();

		results.push({
			type: 'small',
			buffer: outputBuffer,
			width: outputMeta.width!,
			height: outputMeta.height!,
			sizeBytes: outputBuffer.length,
			format: 'webp'
		});
	}

	return results;
}
