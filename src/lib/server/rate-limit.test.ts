import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRateLimitScope, RateLimiter } from './rate-limit';

afterEach(() => {
	vi.useRealTimers();
});

describe('getRateLimitScope', () => {
	it('only rate limits the OAuth token exchange within auth routes', () => {
		expect(getRateLimitScope('/auth/login', 'GET')).toBeNull();
		expect(getRateLimitScope('/auth/callback', 'GET')).toBeNull();
		expect(getRateLimitScope('/auth/exchange', 'GET')).toBeNull();
		expect(getRateLimitScope('/auth/exchange', 'POST')).toBe('auth');
	});

	it('distinguishes uploads from other API requests', () => {
		expect(getRateLimitScope('/api/images', 'POST')).toBe('upload');
		expect(getRateLimitScope('/api/images', 'GET')).toBe('api');
		expect(getRateLimitScope('/api/folders', 'POST')).toBe('api');
		expect(getRateLimitScope('/apiary', 'GET')).toBeNull();
	});
});

describe('RateLimiter', () => {
	it('reports when a rejected client may retry', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));

		const limiter = new RateLimiter(2, 60_000);
		expect(limiter.check('client')).toBe(true);
		expect(limiter.check('client')).toBe(true);
		expect(limiter.check('client')).toBe(false);
		expect(limiter.retryAfterSeconds('client')).toBe(60);

		vi.advanceTimersByTime(30_500);
		expect(limiter.retryAfterSeconds('client')).toBe(30);

		vi.advanceTimersByTime(29_500);
		expect(limiter.check('client')).toBe(true);
	});
});
