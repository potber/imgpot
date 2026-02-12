import sharp from 'sharp';
import { VARIATION_CONFIGS, type ProcessedVariation } from './variations';

// 8192 * 8192 = 67,108,864 pixels — matches our dimension validation
const MAX_INPUT_PIXELS = 8192 * 8192;

const SHARP_OPTIONS: sharp.SharpOptions = { limitInputPixels: MAX_INPUT_PIXELS };

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'gif', 'webp']);

export interface ImageMetadata {
	width: number;
	height: number;
	sizeBytes: number;
	format: string;
}

export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
	const metadata = await sharp(buffer, SHARP_OPTIONS).metadata();
	if (!metadata.width || !metadata.height) {
		throw new Error('Could not read image dimensions');
	}
	if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
		throw new Error(`Unsupported image format: ${metadata.format || 'unknown'}`);
	}
	return {
		width: metadata.width,
		height: metadata.height,
		sizeBytes: buffer.length,
		format: metadata.format
	};
}

export async function processImageVariations(
	inputBuffer: Buffer
): Promise<ProcessedVariation[]> {
	const metadata = await sharp(inputBuffer, SHARP_OPTIONS).metadata();
	if (!metadata.width || !metadata.height) {
		throw new Error('Could not read image dimensions');
	}

	const originalWidth = metadata.width;

	const results: ProcessedVariation[] = [];

	for (const config of VARIATION_CONFIGS) {
		// Skip variations that would require upscaling
		if (originalWidth <= config.maxWidth) continue;

		const outputBuffer = await sharp(inputBuffer, SHARP_OPTIONS)
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
		const outputBuffer = await sharp(inputBuffer, SHARP_OPTIONS)
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
