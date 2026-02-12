import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { folders } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	const userFolders = await db
		.select()
		.from(folders)
		.where(eq(folders.userId, locals.user.id))
		.orderBy(folders.name);

	return {
		user: locals.user,
		folders: userFolders
	};
};
