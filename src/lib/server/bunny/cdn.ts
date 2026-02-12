import { getEnv } from '../env';

export function buildCdnUrl(path: string): string {
	const hostname = getEnv('BUNNY_CDN_HOSTNAME');
	return `https://${hostname}/${path}`;
}

export function buildStoragePath(
	userId: number,
	folderSlug: string | null,
	imageId: number,
	filename: string
): string {
	const folder = folderSlug || 'unsorted';
	return `${userId}/${folder}/${imageId}/${filename}`;
}
