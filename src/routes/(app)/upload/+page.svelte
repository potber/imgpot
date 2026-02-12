<script lang="ts">
	import UploadDropzone from '$lib/components/UploadDropzone.svelte';

	let { data } = $props();
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-6 text-2xl font-bold">Upload Images</h1>
	<UploadDropzone folders={data.folders} />
</div>
