import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { images, imageVariations, folders } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = locals.user!;
	const imageId = parseInt(params.id);
	if (isNaN(imageId)) error(400, 'Invalid image ID');

	const [image] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.userId, user.id)))
		.limit(1);

	if (!image) error(404, 'Image not found');

	const variations = await db
		.select()
		.from(imageVariations)
		.where(eq(imageVariations.imageId, imageId));

	let folder = null;
	if (image.folderId) {
		const [f] = await db.select().from(folders).where(eq(folders.id, image.folderId)).limit(1);
		folder = f || null;
	}

	return {
		image: {
			...image,
			createdAt: image.createdAt.toISOString()
		},
		variations: variations.map((v) => ({
			...v,
			createdAt: v.createdAt.toISOString()
		})),
		folder
	};
};
