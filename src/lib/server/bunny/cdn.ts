import crypto from 'node:crypto';
import { getEnv } from '../env';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateStorageToken(length = 10): string {
	const bytes = crypto.randomBytes(length);
	return Array.from(bytes, (b) => BASE62[b % 62]).join('');
}

export function buildCdnUrl(path: string): string {
	const hostname = getEnv('BUNNY_CDN_HOSTNAME');
	return `https://${hostname}/${path}`;
}
