import { getAllowedCorsOrigin } from '$lib/server/cors';

const FORM_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain'
];

export function isFormContentType(contentType: string | null): boolean {
	if (!contentType) {
		return false;
	}

	const normalizedContentType = contentType.toLowerCase();
	return FORM_CONTENT_TYPES.some((type) => normalizedContentType.startsWith(type));
}

export function requiresFormOriginCheck(method: string, contentType: string | null): boolean {
	return FORM_METHODS.has(method.toUpperCase()) && isFormContentType(contentType);
}

export function isAllowedFormOrigin(
	requestOrigin: string | null,
	requestUrl: URL,
	isApiRoute: boolean,
	allowedApiOrigins: string[]
): boolean {
	if (requestOrigin === requestUrl.origin) {
		return true;
	}

	if (!requestOrigin) {
		return false;
	}

	return isApiRoute && getAllowedCorsOrigin(requestOrigin, allowedApiOrigins) === requestOrigin;
}
