<script lang="ts">
	import ImageCard from './ImageCard.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		images: any[];
		children?: Snippet;
	}

	let { images, children }: Props = $props();
</script>

{#if images.length === 0}
	<div class="flex flex-col items-center justify-center py-20 text-center">
		<p class="mb-2 text-lg text-gray-400">No images yet</p>
		<a href="/upload" class="text-blue-400 transition hover:text-blue-300">Upload your first image</a>
	</div>
{:else}
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
		{#each images as image (image.id)}
			<ImageCard {image} />
		{/each}
	</div>
{/if}

{#if children}
	{@render children()}
{/if}
