import adapter from '@sveltejs/adapter-node';

const trustedOrigins = ['http://localhost:4200', 'https://potber.de', 'https://test.potber.de'];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			trustedOrigins
		},
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self'],
				'img-src': ['self', 'https://*.imgpot.de', 'https://*.potber.de', 'https://*.mods.de', 'data:'],
				'font-src': ['self'],
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		}
	}
};

export default config;
