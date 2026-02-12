import crypto from 'node:crypto';
import { getEnv } from '../env';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateStorageToken(length = 10): string {
	const result: string[] = [];
	while (result.length < length) {
		const bytes = crypto.randomBytes(length - result.length);
		for (const b of bytes) {
			if (b < 248) result.push(BASE62[b % 62]); // 248 = 62*4, uniform distribution
			if (result.length >= length) break;
		}
	}
	return result.join('');
}

export function buildCdnUrl(path: string): string {
	const hostname = getEnv('BUNNY_CDN_HOSTNAME');
	return `https://${hostname}/${path}`;
}
