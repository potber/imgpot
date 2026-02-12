<script lang="ts">
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import FolderSidebar from '$lib/components/FolderSidebar.svelte';

	let { data, children } = $props();
	let sidebarOpen = $state(false);
	let isLargeScreen = $state(false);

	onMount(() => {
		const mql = window.matchMedia('(min-width: 1024px)');
		isLargeScreen = mql.matches;
		sidebarOpen = mql.matches;

		function onChange(e: MediaQueryListEvent) {
			isLargeScreen = e.matches;
			sidebarOpen = e.matches;
		}

		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		if (!isLargeScreen) {
			sidebarOpen = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col bg-gray-950 text-white">
	<Navbar user={data.user} onToggleSidebar={toggleSidebar} />
	<div class="relative flex flex-1">
		<FolderSidebar folders={data.folders} open={sidebarOpen} onClose={closeSidebar} />
		<main class="flex-1 p-4 sm:p-6">
			{@render children()}
		</main>
	</div>
</div>
