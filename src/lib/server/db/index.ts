import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema/index';
import { getEnv, getOptionalEnv } from '../env';

const client = createClient({
	url: getEnv('BUNNY_DATABASE_URL'),
	authToken: getOptionalEnv('BUNNY_DATABASE_AUTH_TOKEN')
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
