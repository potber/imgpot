import { relations } from 'drizzle-orm';
import { users } from './users';
import { sessions } from './sessions';
import { folders } from './folders';
import { images } from './images';
import { imageVariations } from './image-variations';

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	folders: many(folders),
	images: many(images)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
	user: one(users, { fields: [folders.userId], references: [users.id] }),
	images: many(images)
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
	user: one(users, { fields: [images.userId], references: [users.id] }),
	folder: one(folders, { fields: [images.folderId], references: [folders.id] }),
	variations: many(imageVariations)
}));

export const imageVariationsRelations = relations(imageVariations, ({ one }) => ({
	image: one(images, { fields: [imageVariations.imageId], references: [images.id] })
}));
