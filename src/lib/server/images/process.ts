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

function sharpInput(buffer: Buffer, animated: boolean): sharp.Sharp {
	return sharp(buffer, { ...SHARP_OPTIONS, animated }).rotate();
}

export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
	const pipeline = sharp(buffer, SHARP_OPTIONS).rotate();
	const metadata = await pipeline.metadata();
	if (!metadata.width || !metadata.height) {
		throw new Error('Could not read image dimensions');
	}
	if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
		throw new Error(`Unsupported image format: ${metadata.format || 'unknown'}`);
	}
	// Get rotated dimensions by running the pipeline
	const { info } = await pipeline.toBuffer({ resolveWithObject: true });
	return {
		width: info.width,
		height: info.height,
		sizeBytes: buffer.length,
		format: metadata.format
	};
}

export async function processImageVariations(
	inputBuffer: Buffer
): Promise<ProcessedVariation[]> {
	const pipeline = sharp(inputBuffer, SHARP_OPTIONS).rotate();
	const metadata = await pipeline.metadata();
	if (!metadata.width || !metadata.height) {
		throw new Error('Could not read image dimensions');
	}

	// Get rotated dimensions to determine correct sizing
	const { info } = await pipeline.toBuffer({ resolveWithObject: true });
	const originalWidth = info.width;
	const isAnimated = metadata.format === 'gif' || (metadata.pages ?? 0) > 1;

	const results: ProcessedVariation[] = [];
	const largeConfig = VARIATION_CONFIGS[0];

	// If original fits within the large threshold, keep it as the "large" variation
	if (originalWidth <= largeConfig.maxWidth) {
		const outputBuffer = await sharpInput(inputBuffer, isAnimated)
			.webp({ quality: largeConfig.quality })
			.toBuffer();
		const outputMeta = await sharp(outputBuffer).metadata();

		results.push({
			type: 'large',
			buffer: outputBuffer,
			width: outputMeta.width!,
			height: outputMeta.height!,
			sizeBytes: outputBuffer.length,
			format: 'webp'
		});
	}

	for (const config of VARIATION_CONFIGS) {
		// Skip if original is too small to downscale to this tier
		if (originalWidth <= config.maxWidth) continue;

		const outputBuffer = await sharpInput(inputBuffer, isAnimated)
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

	return results;
}
