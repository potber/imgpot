import crypto from 'node:crypto';
import { dev } from '$app/environment';
import { db } from '../db/index';
import { sessions, users } from '../db/schema/index';
import { and, eq, gt } from 'drizzle-orm';
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
	const secret = getEnv('SESSION_SECRET');
	if (!dev && secret.length < 32) {
		throw new Error('SESSION_SECRET must be at least 32 characters in production');
	}
	return secret;
}

function hashToken(token: string): string {
	return crypto.createHmac('sha256', getSecret()).update(token).digest('base64url');
}

function generateSessionToken(): string {
	return crypto.randomBytes(32).toString('base64url');
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
	const token = generateSessionToken();
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

	await db.transaction(async (tx) => {
		await tx.delete(sessions).where(eq(sessions.userId, user.id));
		await tx.insert(sessions).values({
			userId: user.id,
			tokenHash: hashToken(token),
			expiresAt
		});
	});

	cookies.set(SESSION_COOKIE, token, {
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

	const result = await db
		.select({
			id: users.id,
			potberUserId: users.potberUserId,
			username: users.username,
			avatarUrl: users.avatarUrl
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(
			and(
				eq(sessions.tokenHash, hashToken(raw)),
				gt(sessions.expiresAt, new Date())
			)
		)
		.limit(1);

	if (result.length === 0) {
		await destroySession(cookies);
		return null;
	}

	const user = result[0];
	return {
		id: user.id,
		potberUserId: user.potberUserId,
		username: user.username,
		avatarUrl: user.avatarUrl
	};
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const raw = cookies.get(SESSION_COOKIE);

	if (raw) {
		await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(raw)));
	}

	cookies.delete(SESSION_COOKIE, { path: '/' });
}
