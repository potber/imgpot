import { pgTable, serial, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const folders = pgTable(
	'folders',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('folders_user_id_name_idx').on(table.userId, table.name)]
);
