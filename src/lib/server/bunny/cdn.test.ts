import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildStoragePath } from './cdn';

describe('buildStoragePath', () => {
	it('builds path with folder', () => {
		const path = buildStoragePath(1, 'my-folder', 42, 'medium.webp');
		expect(path).toBe('1/my-folder/42/medium.webp');
	});

	it('builds path without folder (unsorted)', () => {
		const path = buildStoragePath(1, null, 42, 'medium.webp');
		expect(path).toBe('1/unsorted/42/medium.webp');
	});
});
