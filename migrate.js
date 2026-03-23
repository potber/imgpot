import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

const client = createClient({
	url: process.env.BUNNY_DATABASE_URL,
	authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN
});
const db = drizzle(client);

await migrate(db, { migrationsFolder: './drizzle' });
client.close();

console.log('Migrations complete');
