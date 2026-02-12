import { validateToken } from './oauth';
import { upsertUser, type SessionUser } from './session';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 10_000;

const tokenCache = new Map<string, { user: SessionUser; expiresAt: number }>();

export async function authenticateToken(accessToken: string): Promise<SessionUser> {
	const cached = tokenCache.get(accessToken);
	if (cached) {
		if (cached.expiresAt > Date.now()) {
			return cached.user;
		}
		tokenCache.delete(accessToken);
	}

	const potberSession = await validateToken(accessToken);
	const user = await upsertUser({
		userId: potberSession.userId,
		username: potberSession.username,
		avatarUrl: potberSession.avatarUrl
	});

	// Evict expired entries when approaching capacity
	if (tokenCache.size >= MAX_CACHE_SIZE) {
		const now = Date.now();
		for (const [key, entry] of tokenCache) {
			if (entry.expiresAt <= now) tokenCache.delete(key);
		}
		// If still full, drop the oldest entry
		if (tokenCache.size >= MAX_CACHE_SIZE) {
			const firstKey = tokenCache.keys().next().value;
			if (firstKey) tokenCache.delete(firstKey);
		}
	}

	tokenCache.set(accessToken, { user, expiresAt: Date.now() + CACHE_TTL });

	return user;
}
