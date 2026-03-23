import { describe, expect, it } from 'vitest';
import {
	isAllowedFormOrigin,
	isFormContentType,
	requiresFormOriginCheck
} from './form-origin';

describe('form-origin', () => {
	it('detects protected form content types', () => {
		expect(isFormContentType('multipart/form-data; boundary=test')).toBe(true);
		expect(isFormContentType('application/x-www-form-urlencoded')).toBe(true);
		expect(isFormContentType('text/plain;charset=utf-8')).toBe(true);
		expect(isFormContentType('application/json')).toBe(false);
	});

	it('checks only unsafe form methods', () => {
		expect(requiresFormOriginCheck('POST', 'multipart/form-data')).toBe(true);
		expect(requiresFormOriginCheck('PUT', 'text/plain')).toBe(true);
		expect(requiresFormOriginCheck('GET', 'multipart/form-data')).toBe(false);
		expect(requiresFormOriginCheck('POST', 'application/json')).toBe(false);
	});

	it('allows same-origin form submissions', () => {
		expect(
			isAllowedFormOrigin(
				'https://imgpot.de',
				new URL('https://imgpot.de/api/images'),
				true,
				['https://*.preview.potber.de']
			)
		).toBe(true);
	});

	it('allows allowed preview origins for api routes', () => {
		expect(
			isAllowedFormOrigin(
				'https://pr-17.preview.potber.de',
				new URL('https://imgpot.de/api/images'),
				true,
				['https://*.preview.potber.de']
			)
		).toBe(true);
	});

	it('rejects preview origins for non-api routes', () => {
		expect(
			isAllowedFormOrigin(
				'https://pr-17.preview.potber.de',
				new URL('https://imgpot.de/auth/logout'),
				false,
				['https://*.preview.potber.de']
			)
		).toBe(false);
	});

	it('rejects missing and nested wildcard origins', () => {
		expect(
			isAllowedFormOrigin(null, new URL('https://imgpot.de/api/images'), true, [
				'https://*.preview.potber.de'
			])
		).toBe(false);
		expect(
			isAllowedFormOrigin(
				'https://foo.bar.preview.potber.de',
				new URL('https://imgpot.de/api/images'),
				true,
				['https://*.preview.potber.de']
			)
		).toBe(false);
	});
});
