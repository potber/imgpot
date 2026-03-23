import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'turso',
	schema: './src/lib/server/db/schema/index.ts',
	out: './drizzle',
	dbCredentials: {
		url: process.env.BUNNY_DATABASE_URL!,
		authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN!
	}
});
