<script lang="ts">
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let deleting = $state(false);

	async function deleteFolder() {
		if (!confirm(`Delete folder "${data.folder.name}"? Images will be moved to Unsorted.`)) return;
		deleting = true;
		const res = await fetch(`/api/folders/${data.folder.id}`, { method: 'DELETE' });
		if (res.ok) {
			goto('/dashboard');
		}
		deleting = false;
	}
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">{data.folder.name}</h1>
			<span class="text-sm text-gray-500">{data.total} images</span>
		</div>
		<button
			onclick={deleteFolder}
			disabled={deleting}
			class="rounded bg-red-600/20 px-4 py-2 text-sm text-red-400 transition hover:bg-red-600/30 disabled:opacity-50"
		>
			{deleting ? 'Deleting...' : 'Delete folder'}
		</button>
	</div>

	<ImageGrid images={data.images} folderId={data.folder.id} />

	{#if data.totalPages > 1}
		<div class="mt-6 flex items-center justify-center gap-2">
			{#if data.page > 1}
				<a
					href="?page={data.page - 1}"
					class="rounded bg-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
				>
					Previous
				</a>
			{/if}
			<span class="text-sm text-gray-500">Page {data.page} of {data.totalPages}</span>
			{#if data.page < data.totalPages}
				<a
					href="?page={data.page + 1}"
					class="rounded bg-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
				>
					Next
				</a>
			{/if}
		</div>
	{/if}
</div>
