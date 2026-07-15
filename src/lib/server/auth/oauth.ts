import { getEnv } from '../env';

const POTBER_AUTH_BASE = getEnv('POTBER_AUTH_BASE');
const POTBER_API_BASE = getEnv('POTBER_API_BASE');
const CLIENT_ID = '1b59979e-e95f-4402-85e6-7c0ac509f1c7';

interface PotberSession {
	userId: string;
	username: string;
	avatarUrl: string | null;
	cookie: string;
	iat: number;
	exp: number;
}

export class TokenValidationError extends Error {
	constructor(
		message: string,
		readonly upstreamStatus: number | null,
		options?: ErrorOptions
	) {
		super(message, options);
		this.name = 'TokenValidationError';
	}
}

export function buildAuthorizationUrl(redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: 'token',
		state
	});
	return `${POTBER_AUTH_BASE}/authorize?${params.toString()}`;
}

export async function validateToken(accessToken: string): Promise<PotberSession> {
	let response: Response;
	try {
		response = await fetch(`${POTBER_API_BASE}/auth/session`, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});
	} catch (cause) {
		throw new TokenValidationError('Token validation request failed', null, { cause });
	}

	if (!response.ok) {
		throw new TokenValidationError(
			`Token validation failed with status ${response.status}`,
			response.status
		);
	}

	const data: PotberSession = await response.json();
	return data;
}
