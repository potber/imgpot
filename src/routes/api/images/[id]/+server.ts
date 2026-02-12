import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { images, imageVariations, folders } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteFile } from '$lib/server/bunny/storage';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const imageId = parseInt(params.id);
	if (isNaN(imageId)) error(400, 'Invalid image ID');

	const [image] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.userId, locals.user.id)))
		.limit(1);

	if (!image) error(404, 'Image not found');

	const variations = await db
		.select()
		.from(imageVariations)
		.where(eq(imageVariations.imageId, imageId));

	return json({ ...image, variations });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const imageId = parseInt(params.id);
	if (isNaN(imageId)) error(400, 'Invalid image ID');

	const [image] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.userId, locals.user.id)))
		.limit(1);

	if (!image) error(404, 'Image not found');

	// Get variation filenames before deleting from DB
	const variations = await db
		.select({ storageFilename: imageVariations.storageFilename })
		.from(imageVariations)
		.where(eq(imageVariations.imageId, imageId));

	// Delete files from bunny.net storage
	for (const v of variations) {
		try {
			await deleteFile(v.storageFilename);
		} catch (e) {
			console.error('Failed to delete from bunny.net:', e);
		}
	}

	// Delete from database (cascade deletes variations)
	await db.delete(images).where(eq(images.id, imageId));

	return json({ success: true });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const imageId = parseInt(params.id);
	if (isNaN(imageId)) error(400, 'Invalid image ID');

	let body;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const { folderId } = body;

	const [image] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.userId, locals.user.id)))
		.limit(1);

	if (!image) error(404, 'Image not found');

	// Validate folder belongs to current user
	if (folderId !== undefined && folderId !== null) {
		const [folder] = await db
			.select({ id: folders.id })
			.from(folders)
			.where(and(eq(folders.id, folderId), eq(folders.userId, locals.user.id)))
			.limit(1);
		if (!folder) error(400, 'Folder not found');
	}

	await db
		.update(images)
		.set({ folderId: folderId ?? null })
		.where(eq(images.id, imageId));

	return json({ success: true });
};
