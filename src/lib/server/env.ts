import { env } from '$env/dynamic/private';

export function getEnv(key: string): string {
	const value = env[key];
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value;
}
