import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { images, imageVariations, folders } from '$lib/server/db/schema';
import { eq, desc, and, count, isNull, inArray } from 'drizzle-orm';
import { processImageVariations, getImageMetadata } from '$lib/server/images/process';
import { uploadFile, deleteFile } from '$lib/server/bunny/storage';
import { buildCdnUrl, generateStorageToken } from '$lib/server/bunny/cdn';
import { VARIATION_SUFFIXES } from '$lib/server/images/variations';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1);
	const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '20') || 20, 100));
	const folderId = url.searchParams.get('folder_id');
	const offset = (page - 1) * limit;

	const conditions = [eq(images.userId, locals.user.id)];
	if (folderId === 'unsorted') {
		conditions.push(isNull(images.folderId));
	} else if (folderId) {
		const parsed = parseInt(folderId);
		if (!isNaN(parsed)) conditions.push(eq(images.folderId, parsed));
	}

	const where = and(...conditions);

	const imageList = await db
		.select()
		.from(images)
		.where(where)
		.orderBy(desc(images.createdAt))
		.limit(limit)
		.offset(offset);

	// Get variations for each image
	const imageIds = imageList.map((img) => img.id);
	let variations: (typeof imageVariations.$inferSelect)[] = [];
	if (imageIds.length > 0) {
		variations = await db
			.select()
			.from(imageVariations)
			.where(inArray(imageVariations.imageId, imageIds));
	}

	// Get total count
	const totalResult = await db
		.select({ count: count() })
		.from(images)
		.where(where);
	const total = totalResult[0].count;

	const result = imageList.map((img) => ({
		...img,
		variations: variations.filter((v) => v.imageId === img.id)
	}));

	return json({ images: result, page, limit, total });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const folderIdStr = formData.get('folder_id') as string | null;

	if (!file) error(400, 'No file provided');
	if (file.size === 0) error(400, 'File cannot be empty');
	if (!ALLOWED_TYPES.includes(file.type)) error(400, 'Unsupported file type');
	if (file.size > MAX_FILE_SIZE) error(400, 'File too large (max 20MB)');
	if (!file.name || file.name.trim().length === 0) error(400, 'File must have a name');
	if (file.name.length > 255) error(400, 'Filename too long (max 255 chars)');

	// Validate folder belongs to user
	let folderId: number | null = null;
	if (folderIdStr) {
		const folderResult = await db
			.select()
			.from(folders)
			.where(and(eq(folders.id, parseInt(folderIdStr)), eq(folders.userId, locals.user.id)))
			.limit(1);

		if (folderResult.length === 0) error(400, 'Folder not found');
		folderId = folderResult[0].id;
	}

	const inputBuffer = Buffer.from(await file.arrayBuffer());
	const metadata = await getImageMetadata(inputBuffer);

	if (metadata.width > 8192 || metadata.height > 8192) {
		error(400, 'Image dimensions too large (max 8192x8192)');
	}

	const variations = await processImageVariations(inputBuffer);

	const storageToken = generateStorageToken();

	// Upload all variations to CDN first (before DB commit)
	const uploadedFiles: string[] = [];
	const variationData: {
		type: (typeof variations)[number]['type'];
		filename: string;
		cdnUrl: string;
		width: number;
		height: number;
		sizeBytes: number;
		format: string;
	}[] = [];

	try {
		for (const variation of variations) {
			const suffix = VARIATION_SUFFIXES[variation.type];
			const filename = `${storageToken}${suffix}.webp`;
			const cdnUrl = buildCdnUrl(filename);

			await uploadFile(filename, variation.buffer);
			uploadedFiles.push(filename);

			variationData.push({
				type: variation.type,
				filename,
				cdnUrl,
				width: variation.width,
				height: variation.height,
				sizeBytes: variation.sizeBytes,
				format: variation.format
			});
		}
	} catch (e) {
		// Clean up any files already uploaded
		for (const f of uploadedFiles) {
			try {
				await deleteFile(f);
			} catch {
				// Best-effort cleanup
			}
		}
		throw e;
	}

	// Atomically insert image + variations in a transaction
	const result = await db.transaction(async (tx) => {
		const [imageRecord] = await tx
			.insert(images)
			.values({
				userId: locals.user.id,
				folderId,
				originalFilename: file.name,
				mimeType: file.type,
				originalWidth: metadata.width,
				originalHeight: metadata.height,
				originalSizeBytes: metadata.sizeBytes,
				storageToken,
				storagePath: storageToken
			})
			.returning();

		const variationRecords = [];
		for (const v of variationData) {
			const [record] = await tx
				.insert(imageVariations)
				.values({
					imageId: imageRecord.id,
					variationType: v.type,
					width: v.width,
					height: v.height,
					sizeBytes: v.sizeBytes,
					format: v.format,
					storageFilename: v.filename,
					cdnUrl: v.cdnUrl
				})
				.returning();
			variationRecords.push(record);
		}

		return { ...imageRecord, variations: variationRecords };
	});

	return json(result, { status: 201 });
};
