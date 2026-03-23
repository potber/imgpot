import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { images } from './images';

export const variationTypes = [
	'large',
	'medium',
	'small'
 ] as const;

export type VariationType = (typeof variationTypes)[number];

export const imageVariations = sqliteTable('image_variations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	imageId: integer('image_id')
		.notNull()
		.references(() => images.id, { onDelete: 'cascade' }),
	variationType: text('variation_type', { enum: variationTypes }).$type<VariationType>().notNull(),
	width: integer('width').notNull(),
	height: integer('height').notNull(),
	sizeBytes: integer('size_bytes').notNull(),
	format: text('format').notNull(),
	storageFilename: text('storage_filename').notNull(),
	cdnUrl: text('cdn_url').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});
