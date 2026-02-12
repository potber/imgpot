import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { folders } from './folders';

export const images = pgTable('images', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	folderId: integer('folder_id').references(() => folders.id, { onDelete: 'set null' }),
	originalFilename: text('original_filename').notNull(),
	mimeType: text('mime_type').notNull(),
	originalWidth: integer('original_width').notNull(),
	originalHeight: integer('original_height').notNull(),
	originalSizeBytes: integer('original_size_bytes').notNull(),
	storagePath: text('storage_path').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
