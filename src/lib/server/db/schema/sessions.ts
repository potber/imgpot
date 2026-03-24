import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const sessions = sqliteTable(
	'sessions',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
		index('sessions_user_id_idx').on(table.userId)
	]
);
