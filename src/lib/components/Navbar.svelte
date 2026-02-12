<script lang="ts">
	interface Props {
		user: { username: string; avatarUrl: string | null };
		onToggleSidebar: () => void;
	}

	let { user, onToggleSidebar }: Props = $props();
</script>

<nav class="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 sm:px-6">
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
		<div class="hidden items-center gap-2 sm:flex">
			{#if user.avatarUrl}
				<img src={user.avatarUrl} alt="" class="h-8 rounded-full" />
			{/if}
			<span class="text-sm text-gray-300">{user.username}</span>
		</div>
		<a href="/settings" class="text-sm text-gray-400 transition hover:text-white">
			Settings
		</a>
		<form method="POST" action="/auth/logout">
			<button
				type="submit"
				class="text-sm text-gray-400 transition hover:text-white"
			>
				Logout
			</button>
		</form>
	</div>
</nav>
