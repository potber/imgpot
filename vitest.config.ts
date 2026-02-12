import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		alias: {
			'$env/dynamic/private': new URL('./src/test/env-mock.ts', import.meta.url).pathname,
			'$app/environment': new URL('./src/test/app-environment-mock.ts', import.meta.url).pathname,
			'$lib': path.resolve(__dirname, 'src/lib')
		}
	}
});
