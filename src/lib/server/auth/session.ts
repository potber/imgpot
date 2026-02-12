import crypto from 'node:crypto';
import { dev } from '$app/environment';
import { db } from '../db/index';
import { users } from '../db/schema/index';
import { eq } from 'drizzle-orm';
import { getEnv } from '../env';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
	id: number;
	potberUserId: string;
	username: string;
	avatarUrl: string | null;
}

function getSecret(): string {
	return getEnv('SESSION_SECRET');
}

function sign(value: string): string {
	const sig = crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
	return `${value}.${sig}`;
}

function verify(signed: string): string | null {
	const idx = signed.lastIndexOf('.');
	if (idx === -1) return null;

	const value = signed.slice(0, idx);
	const sig = signed.slice(idx + 1);
	if (!value || !sig) return null;

	const expected = crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
	if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

	return value;
}

export async function upsertUser(potberUser: {
	userId: string;
	username: string;
	avatarUrl: string | null;
}): Promise<SessionUser> {
	const existing = await db
		.select()
		.from(users)
		.where(eq(users.potberUserId, potberUser.userId))
		.limit(1);

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
		return {
			id: updated.id,
			potberUserId: updated.potberUserId,
			username: updated.username,
			avatarUrl: updated.avatarUrl
		};
	}

	const [created] = await db
		.insert(users)
		.values({
			potberUserId: potberUser.userId,
			username: potberUser.username,
			avatarUrl: potberUser.avatarUrl
		})
		.returning();
	return {
		id: created.id,
		potberUserId: created.potberUserId,
		username: created.username,
		avatarUrl: created.avatarUrl
	};
}

export async function createSession(
	cookies: Cookies,
	potberUser: { userId: string; username: string; avatarUrl: string | null }
): Promise<SessionUser> {
	const user = await upsertUser(potberUser);

	cookies.set(SESSION_COOKIE, sign(`${user.id}`), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: SESSION_MAX_AGE
	});

	return user;
}

export async function getSessionUser(cookies: Cookies): Promise<SessionUser | null> {
	const raw = cookies.get(SESSION_COOKIE);
	if (!raw) return null;

	const sessionId = verify(raw);
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
