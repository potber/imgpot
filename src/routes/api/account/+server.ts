import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, images, imageVariations, folders } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { deleteFile } from '$lib/server/bunny/storage';
import { destroySession } from '$lib/server/auth/session';

export const DELETE: RequestHandler = async ({ locals, cookies }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const userId = locals.user.id;

	// Collect CDN filenames before deleting from DB
	const userImages = await db
		.select({ id: images.id })
		.from(images)
		.where(eq(images.userId, userId));

	let cdnFilenames: string[] = [];
	if (userImages.length > 0) {
		const imageIds = userImages.map((img) => img.id);
		const variations = await db
			.select({ storageFilename: imageVariations.storageFilename })
			.from(imageVariations)
			.where(inArray(imageVariations.imageId, imageIds));
		cdnFilenames = variations.map((v) => v.storageFilename);
	}

	// Delete all DB records atomically
	await db.transaction(async (tx) => {
		if (userImages.length > 0) {
			await tx.delete(images).where(eq(images.userId, userId));
		}
		await tx.delete(folders).where(eq(folders.userId, userId));
		await tx.delete(users).where(eq(users.id, userId));
	});

	// Clean up CDN files after DB commit (best-effort)
	for (const filename of cdnFilenames) {
		try {
			await deleteFile(filename);
		} catch (e) {
			console.error('Failed to delete CDN file:', filename, e);
		}
	}

	destroySession(cookies);

	return json({ success: true });
};
