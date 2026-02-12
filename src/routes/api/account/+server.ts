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

	// Collect all CDN filenames for this user's images
	const userImages = await db
		.select({ id: images.id })
		.from(images)
		.where(eq(images.userId, userId));

	if (userImages.length > 0) {
		const imageIds = userImages.map((img) => img.id);
		const variations = await db
			.select({ storageFilename: imageVariations.storageFilename })
			.from(imageVariations)
			.where(inArray(imageVariations.imageId, imageIds));

		// Delete all files from CDN
		for (const v of variations) {
			try {
				await deleteFile(v.storageFilename);
			} catch (e) {
				console.error('Failed to delete CDN file:', v.storageFilename, e);
			}
		}

		// Delete all images (cascades to image_variations)
		await db.delete(images).where(eq(images.userId, userId));
	}

	// Delete folders
	await db.delete(folders).where(eq(folders.userId, userId));

	// Delete user
	await db.delete(users).where(eq(users.id, userId));

	// Destroy session
	destroySession(cookies);

	return json({ success: true });
};
