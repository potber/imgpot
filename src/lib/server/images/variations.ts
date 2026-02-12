export type VariationType = 'original' | 'large' | 'medium' | 'small';

export interface VariationConfig {
	type: VariationType;
	maxWidth: number | null;
	quality: number;
}

export const VARIATION_CONFIGS: VariationConfig[] = [
	{ type: 'original', maxWidth: null, quality: 90 },
	{ type: 'large', maxWidth: 1600, quality: 82 },
	{ type: 'medium', maxWidth: 800, quality: 80 },
	{ type: 'small', maxWidth: 320, quality: 78 }
];

export interface ProcessedVariation {
	type: VariationType;
	buffer: Buffer;
	width: number;
	height: number;
	sizeBytes: number;
	format: string;
}
