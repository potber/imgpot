import { getEnv } from '../env';

function getStorageConfig() {
	return {
		zone: getEnv('BUNNY_STORAGE_ZONE'),
		apiKey: getEnv('BUNNY_STORAGE_API_KEY'),
		region: getEnv('BUNNY_STORAGE_REGION')
	};
}

function storageUrl(path: string): string {
	const { zone, region } = getStorageConfig();
	return `https://${region}/${zone}/${path}`;
}

export async function uploadFile(path: string, buffer: Buffer): Promise<void> {
	const { apiKey } = getStorageConfig();

	const response = await fetch(storageUrl(path), {
		method: 'PUT',
		headers: {
			AccessKey: apiKey,
			'Content-Type': 'application/octet-stream'
		},
		body: new Uint8Array(buffer)
	});

	if (!response.ok) {
		throw new Error(`Bunny upload failed: ${response.status} ${await response.text()}`);
	}
}

export async function deleteFile(path: string): Promise<void> {
	const { apiKey } = getStorageConfig();

	const response = await fetch(storageUrl(path), {
		method: 'DELETE',
		headers: {
			AccessKey: apiKey
		}
	});

	if (!response.ok) {
		throw new Error(`Bunny delete failed: ${response.status}`);
	}
}

export async function deleteDirectory(path: string): Promise<void> {
	// Bunny.net treats directories like file prefixes
	// DELETE on a path ending with / deletes the directory
	const dirPath = path.endsWith('/') ? path : `${path}/`;
	const { apiKey } = getStorageConfig();

	const response = await fetch(storageUrl(dirPath), {
		method: 'DELETE',
		headers: {
			AccessKey: apiKey
		}
	});

	if (!response.ok) {
		throw new Error(`Bunny directory delete failed: ${response.status}`);
	}
}
