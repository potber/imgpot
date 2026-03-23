import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			// We enforce our own origin policy in hooks so `/api/*` can allow
			// wildcard preview origins while non-API form submissions stay same-origin.
			trustedOrigins: ['*']
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
