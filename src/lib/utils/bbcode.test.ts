import { describe, it, expect } from 'vitest';
import { bbcodeImage, bbcodeClickToEnlarge } from './bbcode';

describe('bbcodeImage', () => {
	it('wraps URL in [img] tags', () => {
		expect(bbcodeImage('https://cdn.example.com/img.webp')).toBe(
			'[img]https://cdn.example.com/img.webp[/img]'
		);
	});
});

describe('bbcodeClickToEnlarge', () => {
	it('wraps in [url][img] for click-to-enlarge', () => {
		const result = bbcodeClickToEnlarge(
			'https://cdn.example.com/original.webp',
			'https://cdn.example.com/medium.webp'
		);
		expect(result).toBe(
			'[url=https://cdn.example.com/original.webp][img]https://cdn.example.com/medium.webp[/img][/url]'
		);
	});
});
