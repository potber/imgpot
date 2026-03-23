import { describe, expect, it } from 'vitest';
import { getAllowedCorsOrigin, matchesAllowedOrigin, parseAllowedOrigins } from './cors';

describe('matchesAllowedOrigin', () => {
	it('matches an exact origin', () => {
		expect(matchesAllowedOrigin('https://potber.de', 'https://potber.de')).toBe(true);
	});

	it('matches a single-label wildcard subdomain', () => {
		expect(
			matchesAllowedOrigin(
				'https://*.preview.potber.de',
				'https://pr-17.preview.potber.de'
			)
		).toBe(true);
	});

	it('rejects nested wildcard subdomains', () => {
		expect(
			matchesAllowedOrigin(
				'https://*.preview.potber.de',
				'https://foo.bar.preview.potber.de'
			)
		).toBe(false);
	});
});

describe('parseAllowedOrigins', () => {
	it('parses a comma-separated list', () => {
		expect(parseAllowedOrigins('https://potber.de, https://test.potber.de')).toEqual([
			'https://potber.de',
			'https://test.potber.de'
		]);
	});
});

describe('getAllowedCorsOrigin', () => {
	it('returns the origin when it is allowed', () => {
		expect(getAllowedCorsOrigin('https://potber.de', ['https://potber.de'])).toBe(
			'https://potber.de'
		);
	});

	it('returns null when it is not allowed', () => {
		expect(getAllowedCorsOrigin('https://evil.example', ['https://potber.de'])).toBe(null);
	});
});
