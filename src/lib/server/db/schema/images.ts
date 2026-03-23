import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { folders } from './folders';

export const images = sqliteTable(
	'images',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		folderId: integer('folder_id').references(() => folders.id, { onDelete: 'set null' }),
		originalFilename: text('original_filename').notNull(),
		mimeType: text('mime_type').notNull(),
		originalWidth: integer('original_width').notNull(),
		originalHeight: integer('original_height').notNull(),
		originalSizeBytes: integer('original_size_bytes').notNull(),
		storageToken: text('storage_token').notNull(),
		storagePath: text('storage_path').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [uniqueIndex('images_storage_token_idx').on(table.storageToken)]
);
