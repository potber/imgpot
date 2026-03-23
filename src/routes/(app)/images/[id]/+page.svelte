<script lang="ts">
	import UrlCopyPanel from '$lib/components/UrlCopyPanel.svelte';
	import { formatFileSize } from '$lib/utils/file';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let deleting = $state(false);
	let movingToFolder = $state('');

	const preview = $derived(
		data.variations.find((v) => v.variationType === 'large') ||
			data.variations.find((v) => v.variationType === 'medium') ||
			data.variations[0]
	);

	async function deleteImage() {
		if (!confirm('Delete this image? This cannot be undone.')) return;
		deleting = true;
		const res = await fetch(`/api/images/${data.image.id}`, { method: 'DELETE' });
		if (res.ok) {
			goto('/dashboard');
		}
		deleting = false;
	}

	async function moveToFolder() {
		const folderId = movingToFolder || null;
		await fetch(`/api/images/${data.image.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ folderId: folderId ? parseInt(folderId) : null })
		});
		window.location.reload();
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-4">
		<a href="/dashboard" class="text-sm text-gray-400 transition hover:text-white">&larr; Back to gallery</a>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Preview -->
		<div>
			{#if preview}
				<img
					src={preview.cdnUrl}
					alt={data.image.originalFilename}
					class="w-full rounded-lg"
				/>
			{/if}
		</div>

		<!-- Details & URLs -->
		<div class="space-y-6">
			<div>
				<h1 class="text-xl font-bold">{data.image.originalFilename}</h1>
				<div class="mt-2 space-y-1 text-sm text-gray-400">
					<p>{data.image.originalWidth} x {data.image.originalHeight}</p>
					<p>{formatFileSize(data.image.originalSizeBytes)}</p>
					<p>{new Date(data.image.createdAt).toLocaleDateString()}</p>
					{#if data.folder}
						<p>Folder: {data.folder.name}</p>
					{:else}
						<p>Folder: Unsorted</p>
					{/if}
				</div>
			</div>

			<UrlCopyPanel variations={data.variations} />

			<!-- Move to folder -->
			<div class="rounded-lg bg-gray-800 p-3">
				<label for="move-folder" class="mb-2 block text-sm text-gray-400">Move to folder</label>
				<div class="flex gap-2">
					<select
						id="move-folder"
						bind:value={movingToFolder}
						class="flex-1 rounded bg-gray-900 px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
					>
						<option value="">Unsorted</option>
						{#each data.folders as folder}
							<option value={folder.id}>{folder.name}</option>
						{/each}
					</select>
					<button
						onclick={moveToFolder}
						class="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-600"
					>
						Move
					</button>
				</div>
			</div>

			<!-- Delete -->
			<button
				onclick={deleteImage}
				disabled={deleting}
				class="w-full rounded-lg bg-red-600/20 px-4 py-2 text-sm text-red-400 transition hover:bg-red-600/30 disabled:opacity-50"
			>
				{deleting ? 'Deleting...' : 'Delete image'}
			</button>
		</div>
	</div>
</div>
