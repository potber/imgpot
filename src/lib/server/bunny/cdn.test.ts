import { describe, it, expect } from 'vitest';
import { generateStorageToken } from './cdn';

describe('generateStorageToken', () => {
	it('generates a 10-character token by default', () => {
		const token = generateStorageToken();
		expect(token).toHaveLength(10);
		expect(token).toMatch(/^[A-Za-z0-9]+$/);
	});

	it('generates a token of custom length', () => {
		const token = generateStorageToken(12);
		expect(token).toHaveLength(12);
		expect(token).toMatch(/^[A-Za-z0-9]+$/);
	});

	it('generates unique tokens', () => {
		const tokens = new Set(Array.from({ length: 100 }, () => generateStorageToken()));
		expect(tokens.size).toBe(100);
	});
});
