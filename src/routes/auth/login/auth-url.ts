const POTBER_AUTH_BASE = 'https://auth.potber.de';
const CLIENT_ID = '1b59979e-e95f-4402-85e6-7c0ac509f1c7';

export function buildAuthorizationUrl(): string {
	const redirectUri =
		typeof window !== 'undefined' && window.location.hostname !== 'localhost'
			? 'https://imgpot.de/auth/callback'
			: 'http://localhost:3000/auth/callback';

	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: 'token'
	});
	return `${POTBER_AUTH_BASE}/authorize?${params.toString()}`;
}
