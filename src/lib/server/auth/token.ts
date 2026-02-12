import { validateToken } from './oauth';
import { upsertUser, type SessionUser } from './session';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

	tokenCache.set(accessToken, { user, expiresAt: Date.now() + CACHE_TTL });

	return user;
}
