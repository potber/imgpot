interface RateLimitEntry {
	count: number;
	resetAt: number;
}

export type RateLimitScope = 'auth' | 'upload' | 'api';

export function getRateLimitScope(path: string, method: string): RateLimitScope | null {
	if (path === '/auth/exchange' && method === 'POST') return 'auth';
	if (!path.startsWith('/api/')) return null;
	if (path === '/api/images' && method === 'POST') return 'upload';
	return 'api';
}

export class RateLimiter {
	private store = new Map<string, RateLimitEntry>();
	private maxEntries: number;

	constructor(
		private limit: number,
		private windowMs: number,
		maxEntries = 10_000
	) {
		this.maxEntries = maxEntries;
	}

	check(key: string): boolean {
		const now = Date.now();
		const entry = this.store.get(key);

		if (!entry || entry.resetAt <= now) {
			this.store.set(key, { count: 1, resetAt: now + this.windowMs });
			this.evictIfNeeded();
			return true;
		}

		entry.count++;
		return entry.count <= this.limit;
	}

	retryAfterSeconds(key: string): number {
		const entry = this.store.get(key);
		if (!entry) return 0;

		return Math.max(0, Math.ceil((entry.resetAt - Date.now()) / 1000));
	}

	private evictIfNeeded(): void {
		if (this.store.size <= this.maxEntries) return;

		const now = Date.now();
		for (const [key, entry] of this.store) {
			if (entry.resetAt <= now) this.store.delete(key);
		}

		// If still over limit, drop oldest entries
		if (this.store.size > this.maxEntries) {
			const excess = this.store.size - this.maxEntries;
			let removed = 0;
			for (const key of this.store.keys()) {
				if (removed >= excess) break;
				this.store.delete(key);
				removed++;
			}
		}
	}
}
