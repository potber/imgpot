import { db } from '../db/index';
import { users } from '../db/schema/index';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface SessionUser {
	id: number;
	potberUserId: string;
	username: string;
	avatarUrl: string | null;
}

export async function createSession(
	cookies: Cookies,
	potberUser: { userId: string; username: string; avatarUrl: string | null }
): Promise<SessionUser> {
	// Upsert user
	const existing = await db
		.select()
		.from(users)
		.where(eq(users.potberUserId, potberUser.userId))
		.limit(1);

	let user: SessionUser;

	if (existing.length > 0) {
		const [updated] = await db
			.update(users)
			.set({
				username: potberUser.username,
				avatarUrl: potberUser.avatarUrl,
				updatedAt: new Date()
			})
			.where(eq(users.potberUserId, potberUser.userId))
			.returning();
		user = {
			id: updated.id,
			potberUserId: updated.potberUserId,
			username: updated.username,
			avatarUrl: updated.avatarUrl
		};
	} else {
		const [created] = await db
			.insert(users)
			.values({
				potberUserId: potberUser.userId,
				username: potberUser.username,
				avatarUrl: potberUser.avatarUrl
			})
			.returning();
		user = {
			id: created.id,
			potberUserId: created.potberUserId,
			username: created.username,
			avatarUrl: created.avatarUrl
		};
	}

	// Store the user ID as session value (signed via cookie secret in hooks)
	const sessionId = `${user.id}`;

	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // Allow HTTP in dev (localhost:3000)
		maxAge: SESSION_MAX_AGE
	});

	return user;
}

export async function getSessionUser(cookies: Cookies): Promise<SessionUser | null> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (!sessionId) return null;

	const userId = parseInt(sessionId, 10);
	if (isNaN(userId)) return null;

	const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

	if (result.length === 0) return null;

	const user = result[0];
	return {
		id: user.id,
		potberUserId: user.potberUserId,
		username: user.username,
		avatarUrl: user.avatarUrl
	};
}

export function destroySession(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
