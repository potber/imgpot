import { pgTable, serial, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { images } from './images';

export const variationTypeEnum = pgEnum('variation_type', [
	'large',
	'medium',
	'small'
]);

export const imageVariations = pgTable('image_variations', {
	id: serial('id').primaryKey(),
	imageId: integer('image_id')
		.notNull()
		.references(() => images.id, { onDelete: 'cascade' }),
	variationType: variationTypeEnum('variation_type').notNull(),
	width: integer('width').notNull(),
	height: integer('height').notNull(),
	sizeBytes: integer('size_bytes').notNull(),
	format: text('format').notNull(),
	storageFilename: text('storage_filename').notNull(),
	cdnUrl: text('cdn_url').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
