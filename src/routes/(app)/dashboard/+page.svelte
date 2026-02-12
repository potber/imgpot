<script lang="ts">
	import ImageGrid from '$lib/components/ImageGrid.svelte';

	let { data } = $props();
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Images</h1>
		<span class="text-sm text-gray-500">{data.total} total</span>
	</div>

	<ImageGrid images={data.images} />

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
