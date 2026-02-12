<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let status = $state('Signing in...');

	onMount(async () => {
		const hash = window.location.hash.substring(1);
		const params = new URLSearchParams(hash);
		const accessToken = params.get('access_token');
		const state = params.get('state');

		if (!accessToken) {
			status = 'Authentication failed. No access token received.';
			return;
		}

		try {
			const response = await fetch('/auth/exchange', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accessToken, state })
			});

			if (!response.ok) {
				const data = await response.json();
				status = data.error || 'Authentication failed.';
				return;
			}

			goto('/dashboard');
		} catch {
			status = 'Authentication failed. Please try again.';
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-950">
	<div class="text-center">
		<p class="text-lg text-gray-300">{status}</p>
		{#if status !== 'Signing in...'}
			<a href="/auth/login" class="mt-4 inline-block text-blue-400 hover:text-blue-300">
				Back to login
			</a>
		{/if}
	</div>
</div>
