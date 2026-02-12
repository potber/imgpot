<script lang="ts">
	import { buildAuthorizationUrl } from './auth-url.js';

	const authUrl = buildAuthorizationUrl();
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-950">
	<div class="w-full max-w-sm rounded-lg bg-gray-900 p-8 text-center">
		<h1 class="mb-2 text-2xl font-bold text-white">imgpot</h1>
		<p class="mb-6 text-gray-400">Image hosting for us</p>
		<a
			href={authUrl}
			class="inline-block w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500"
		>
			Sign in
		</a>
	</div>
</div>
