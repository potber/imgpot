import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';
import { getEnv } from '../env';

const client = postgres(getEnv('DATABASE_URL'));

export const db = drizzle(client, { schema });
export type Database = typeof db;
