import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { images, imageVariations } from '$lib/server/db/schema';
import { eq, desc, and, isNull, inArray, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;
	const folderFilter = url.searchParams.get('folder');

	const conditions = [eq(images.userId, user.id)];
	if (folderFilter === 'unsorted') {
		conditions.push(isNull(images.folderId));
	}

	const imageList = await db
		.select()
		.from(images)
		.where(and(...conditions))
		.orderBy(desc(images.createdAt))
		.limit(limit)
		.offset(offset);

	const totalResult = await db
		.select({ count: count() })
		.from(images)
		.where(and(...conditions));
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
		images: imagesWithVariations,
		page,
		totalPages: Math.ceil(total / limit),
		total
	};
};
