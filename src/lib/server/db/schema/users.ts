import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		potberUserId: text('potber_user_id').notNull(),
		username: text('username').notNull(),
		avatarUrl: text('avatar_url'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('users_potber_user_id_idx').on(table.potberUserId)]
);
