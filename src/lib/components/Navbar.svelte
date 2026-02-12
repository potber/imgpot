<script lang="ts">
	interface Props {
		user: { username: string; avatarUrl: string | null };
		onToggleSidebar: () => void;
	}

	let { user, onToggleSidebar }: Props = $props();

	let menuOpen = $state(false);
	let menuContainer: HTMLDivElement;

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleWindowClick(e: MouseEvent) {
		if (menuOpen && menuContainer && !menuContainer.contains(e.target as Node)) {
			closeMenu();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) {
			closeMenu();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<nav class="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 pt-[env(safe-area-inset-top)] sm:px-6">
	<div class="flex items-center gap-3">
		<button
			onclick={onToggleSidebar}
			class="rounded p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white"
			aria-label="Toggle sidebar"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
			</svg>
		</button>
		<a href="/dashboard" class="text-xl font-bold text-white">imgpot</a>
	</div>
	<div class="flex items-center gap-4">
		<a
			href="/upload"
			class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
		>
			Upload
		</a>
		<div class="relative" bind:this={menuContainer}>
			<button
				onclick={toggleMenu}
				class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
			>
				{#if user.avatarUrl}
					<img src={user.avatarUrl} alt="" class="h-8 rounded-full" />
				{/if}
				<span class="text-sm">{user.username}</span>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
				</svg>
			</button>
			{#if menuOpen}
				<div class="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
					<a
						href="/settings"
						onclick={closeMenu}
						class="block px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
					>
						Settings
					</a>
					<form method="POST" action="/auth/logout">
						<button
							type="submit"
							class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
						>
							Logout
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
</nav>
