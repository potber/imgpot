const POTBER_AUTH_BASE = 'https://auth.potber.de';
const CLIENT_ID = '1b59979e-e95f-4402-85e6-7c0ac509f1c7';

export function buildAuthorizationUrl(): string {
	const origin =
		typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
	const redirectUri = `${origin}/auth/callback`;

	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: 'token'
	});
	return `${POTBER_AUTH_BASE}/authorize?${params.toString()}`;
}
