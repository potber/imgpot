<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	let confirmText = $state('');
	let deleting = $state(false);
	let errorMessage = $state('');

	const confirmed = $derived(confirmText === data.user.username);

	async function deleteAccount() {
		if (!confirmed) return;

		deleting = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/account', { method: 'DELETE' });
			if (!res.ok) {
				const body = await res.json();
				errorMessage = body.message || 'Failed to delete account';
				return;
			}
			goto('/auth/login');
		} catch {
			errorMessage = 'Something went wrong. Please try again.';
		} finally {
			deleting = false;
		}
	}
</script>

<div class="mx-auto max-w-xl">
	<h1 class="mb-8 text-2xl font-bold">Settings</h1>

	<section class="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
		<h2 class="mb-2 text-lg font-semibold text-red-400">Delete Account</h2>
		<p class="mb-4 text-sm text-gray-400">
			This will permanently delete your account, all your images, and all your folders.
			This action cannot be undone.
		</p>

		<label class="mb-4 block">
			<span class="mb-1 block text-sm text-gray-400">
				Type <strong class="text-white">{data.user.username}</strong> to confirm
			</span>
			<input
				type="text"
				bind:value={confirmText}
				class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
				placeholder={data.user.username}
				disabled={deleting}
			/>
		</label>

		{#if errorMessage}
			<p class="mb-4 text-sm text-red-400">{errorMessage}</p>
		{/if}

		<button
			onclick={deleteAccount}
			disabled={!confirmed || deleting}
			class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{deleting ? 'Deleting...' : 'Delete my account'}
		</button>
	</section>
</div>
