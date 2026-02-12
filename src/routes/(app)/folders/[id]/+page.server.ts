import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { folders, images, imageVariations } from '$lib/server/db/schema';
import { eq, and, desc, inArray, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const user = locals.user!;
	const folderId = parseInt(params.id);
	if (isNaN(folderId)) error(400, 'Invalid folder ID');

	const [folder] = await db
		.select()
		.from(folders)
		.where(and(eq(folders.id, folderId), eq(folders.userId, user.id)))
		.limit(1);

	if (!folder) error(404, 'Folder not found');

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	const imageList = await db
		.select()
		.from(images)
		.where(and(eq(images.userId, user.id), eq(images.folderId, folderId)))
		.orderBy(desc(images.createdAt))
		.limit(limit)
		.offset(offset);

	const totalResult = await db
		.select({ count: count() })
		.from(images)
		.where(and(eq(images.userId, user.id), eq(images.folderId, folderId)));
	const total = totalResult[0].count;

	let variations: (typeof imageVariations.$inferSelect)[] = [];
	if (imageList.length > 0) {
		variations = await db
			.select()
			.from(imageVariations)
			.where(
				inArray(
					imageVariations.imageId,
					imageList.map((img) => img.id)
				)
			);
	}

	const imagesWithVariations = imageList.map((img) => ({
		...img,
		createdAt: img.createdAt.toISOString(),
		variations: variations.filter((v) => v.imageId === img.id)
	}));

	return {
		folder,
		images: imagesWithVariations,
		page,
		totalPages: Math.ceil(total / limit),
		total
	};
};
