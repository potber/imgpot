<script lang="ts">
	import { page } from '$app/state';

	interface Folder {
		id: number;
		name: string;
		slug: string;
	}

	interface Props {
		folders: Folder[];
		open: boolean;
		onClose: () => void;
	}

	let { folders, open, onClose }: Props = $props();
	let newFolderName = $state('');
	let creating = $state(false);

	async function createFolder() {
		if (!newFolderName.trim()) return;
		creating = true;
		try {
			const res = await fetch('/api/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newFolderName.trim() })
			});
			if (res.ok) {
				newFolderName = '';
				window.location.reload();
			}
		} finally {
			creating = false;
		}
	}

	function handleNav() {
		if (!window.matchMedia('(min-width: 1024px)').matches) {
			onClose();
		}
	}
</script>


<aside
	class="fixed top-14 left-0 z-30 h-[calc(100%-3.5rem)] w-56 shrink-0 border-r border-gray-800 bg-gray-900 p-4 transition-transform duration-200
		lg:static lg:z-auto lg:h-auto lg:min-h-full
		{open ? 'translate-x-0' : '-translate-x-full'}"
>
	<h2 class="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Folders</h2>
	<ul class="space-y-1">
		<li>
			<a
				href="/dashboard"
				onclick={handleNav}
				class="block rounded px-3 py-1.5 text-sm transition {page.url.pathname === '/dashboard' && !page.url.searchParams.has('folder')
					? 'bg-gray-800 text-white'
					: 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}"
			>
				All images
			</a>
		</li>
		<li>
			<a
				href="/dashboard?folder=unsorted"
				onclick={handleNav}
				class="block rounded px-3 py-1.5 text-sm transition {page.url.searchParams.get('folder') === 'unsorted'
					? 'bg-gray-800 text-white'
					: 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}"
			>
				Unsorted
			</a>
		</li>
		{#each folders as folder}
			<li>
				<a
					href="/folders/{folder.id}"
					onclick={handleNav}
					class="block rounded px-3 py-1.5 text-sm transition {page.url.pathname === `/folders/${folder.id}`
						? 'bg-gray-800 text-white'
						: 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}"
				>
					{folder.name}
				</a>
			</li>
		{/each}
	</ul>
	<div class="mt-4 border-t border-gray-800 pt-4">
		<form
			onsubmit={(e) => {
				e.preventDefault();
				createFolder();
			}}
			class="flex gap-2"
		>
			<input
				type="text"
				bind:value={newFolderName}
				placeholder="New folder"
				class="w-full rounded bg-gray-800 px-2 py-1 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			/>
			<button
				type="submit"
				disabled={creating || !newFolderName.trim()}
				class="rounded bg-gray-700 px-2 py-1 text-sm text-gray-300 transition hover:bg-gray-600 disabled:opacity-50"
			>
				+
			</button>
		</form>
	</div>
</aside>
