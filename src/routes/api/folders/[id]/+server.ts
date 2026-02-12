import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { folders, images } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { slugify } from '$lib/utils/slugify';
import { audit } from '$lib/server/audit';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const folderId = parseInt(params.id);
	if (isNaN(folderId)) error(400, 'Invalid folder ID');

	let body;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const { name } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		error(400, 'Folder name is required');
	}

	const [folder] = await db
		.select()
		.from(folders)
		.where(and(eq(folders.id, folderId), eq(folders.userId, locals.user.id)))
		.limit(1);

	if (!folder) error(404, 'Folder not found');

	const trimmedName = name.trim();
	const slug = slugify(trimmedName);

	try {
		const [updated] = await db
			.update(folders)
			.set({ name: trimmedName, slug, updatedAt: new Date() })
			.where(eq(folders.id, folderId))
			.returning();

		return json(updated);
	} catch (e: any) {
		if (e.code === '23505') {
			error(409, 'A folder with this name already exists');
		}
		throw e;
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const folderId = parseInt(params.id);
	if (isNaN(folderId)) error(400, 'Invalid folder ID');

	const [folder] = await db
		.select()
		.from(folders)
		.where(and(eq(folders.id, folderId), eq(folders.userId, locals.user.id)))
		.limit(1);

	if (!folder) error(404, 'Folder not found');

	// Set images in this folder to unsorted (folderId = null)
	await db
		.update(images)
		.set({ folderId: null })
		.where(eq(images.folderId, folderId));

	await db.delete(folders).where(eq(folders.id, folderId));

	audit(locals.user.id, 'folder.delete', { folderId, folderName: folder.name });

	return json({ success: true });
};
