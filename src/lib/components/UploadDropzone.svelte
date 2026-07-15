<script lang="ts">
	import { isValidImageType, formatFileSize } from '$lib/utils/file';

	interface Folder {
		id: number;
		name: string;
	}

	interface UploadResult {
		id: number;
		originalFilename: string;
		variations: { variationType: string; cdnUrl: string }[];
	}

	interface Props {
		folders: Folder[];
		initialFolderId?: string;
	}

	let { folders, initialFolderId = '' }: Props = $props();

	let dragOver = $state(false);
	let uploading = $state(false);
	let progress = $state('');
	let selectedFolderId = $state(initialFolderId);
	let results = $state<UploadResult[]>([]);
	let errorMessage = $state('');

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const files = e.dataTransfer?.files;
		if (files) uploadFiles(Array.from(files));
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) uploadFiles(Array.from(input.files));
	}

	function handlePaste(e: ClipboardEvent) {
		const clipboardData = e.clipboardData;
		if (!clipboardData) return;

		const files: File[] = [];
		for (const item of clipboardData.items) {
			if (item.kind !== 'file') continue;

			const file = item.getAsFile();
			if (file) files.push(file);
		}

		// Some browsers expose clipboard files through `files` but not `items`.
		if (files.length === 0) files.push(...Array.from(clipboardData.files));
		if (files.length === 0) return;

		e.preventDefault();
		uploadFiles(files);
	}

	async function uploadFiles(files: File[]) {
		const imageFiles = files.filter((f) => isValidImageType(f.type));
		if (imageFiles.length === 0) {
			errorMessage = 'No valid image files selected. Supported: JPEG, PNG, GIF, WebP.';
			return;
		}

		uploading = true;
		errorMessage = '';
		results = [];

		for (let i = 0; i < imageFiles.length; i++) {
			const file = imageFiles[i];
			progress = `Uploading ${i + 1} of ${imageFiles.length}: ${file.name} (${formatFileSize(file.size)})`;

			const formData = new FormData();
			formData.append('file', file);
			if (selectedFolderId) {
				formData.append('folder_id', selectedFolderId);
			}

			try {
				const res = await fetch('/api/images', {
					method: 'POST',
					body: formData
				});

				if (!res.ok) {
					const data = await res.json();
					errorMessage = data.message || `Failed to upload ${file.name}`;
					continue;
				}

				const result = await res.json();
				results = [...results, result];
			} catch {
				errorMessage = `Failed to upload ${file.name}`;
			}
		}

		uploading = false;
		progress = '';
	}
</script>

<svelte:window onpaste={handlePaste} />

<div class="space-y-4">
	<div class="flex items-center gap-4">
		<label class="text-sm text-gray-400">
			Folder:
			<select
				bind:value={selectedFolderId}
				class="ml-2 rounded bg-gray-800 px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
			>
				<option value="">Unsorted</option>
				{#each folders as folder}
					<option value={String(folder.id)}>{folder.name}</option>
				{/each}
			</select>
		</label>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<label
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		class="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition
			{dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}"
	>
		{#if uploading}
			<p class="text-gray-300">{progress}</p>
		{:else}
			<p class="mb-2 text-gray-400">Drag & drop or paste images here</p>
			<p class="mb-4 text-sm text-gray-500">JPEG, PNG, GIF, or WebP (max 20MB)</p>
			<span
				class="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-600"
			>
				Choose files
			</span>
			<input
				type="file"
				accept="image/jpeg,image/png,image/gif,image/webp"
				multiple
				class="hidden"
				onchange={handleFileInput}
			/>
		{/if}
	</label>

	{#if errorMessage}
		<p class="text-sm text-red-400">{errorMessage}</p>
	{/if}

	{#if results.length > 0}
		<div class="space-y-3">
			<h3 class="text-sm font-semibold text-gray-400">Uploaded</h3>
			{#each results as result}
				<div class="rounded-lg bg-gray-800 p-3">
					<a href="/images/{result.id}" class="text-sm text-blue-400 hover:text-blue-300">
						{result.originalFilename}
					</a>
				</div>
			{/each}
		</div>
	{/if}
</div>
