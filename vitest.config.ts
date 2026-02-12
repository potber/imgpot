import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		alias: {
			'$env/dynamic/private': new URL('./src/test/env-mock.ts', import.meta.url).pathname
		}
	}
});
