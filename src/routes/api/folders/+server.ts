import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { folders } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const result = await db
		.select()
		.from(folders)
		.where(eq(folders.userId, locals.user.id))
		.orderBy(folders.name);

	return json({ folders: result });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const body = await request.json();
	const { name } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		error(400, 'Folder name is required');
	}

	const trimmedName = name.trim();
	const slug = slugify(trimmedName);

	if (!slug) {
		error(400, 'Invalid folder name');
	}

	try {
		const [folder] = await db
			.insert(folders)
			.values({
				userId: locals.user.id,
				name: trimmedName,
				slug
			})
			.returning();

		return json(folder, { status: 201 });
	} catch (e: any) {
		if (e.code === '23505') {
			error(409, 'A folder with this name already exists');
		}
		throw e;
	}
};
