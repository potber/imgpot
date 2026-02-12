const POTBER_AUTH_BASE = 'https://auth.potber.de';
const POTBER_API_BASE = 'https://api.potber.de';
const CLIENT_ID = '1b59979e-e95f-4402-85e6-7c0ac509f1c7';

interface PotberSession {
	userId: string;
	username: string;
	avatarUrl: string | null;
	cookie: string;
	iat: number;
	exp: number;
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
	const response = await fetch(`${POTBER_API_BASE}/auth/session`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error('Token validation failed');
	}

	const data: PotberSession = await response.json();
	return data;
}
