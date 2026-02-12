<script lang="ts">
	interface Variation {
		variationType: string;
		cdnUrl: string;
		width: number;
		height: number;
	}

	interface Props {
		image: {
			id: number;
			originalFilename: string;
			originalWidth: number;
			originalHeight: number;
			createdAt: string;
			variations: Variation[];
		};
	}

	let { image }: Props = $props();

	const thumbnail = $derived(
		image.variations.find((v) => v.variationType === 'small') ||
			image.variations.find((v) => v.variationType === 'medium') ||
			image.variations[0]
	);
</script>

<a href="/images/{image.id}" class="group block overflow-hidden rounded-lg bg-gray-800 transition hover:ring-2 hover:ring-blue-500">
	<div class="aspect-square overflow-hidden bg-gray-900">
		{#if thumbnail}
			<img
				src={thumbnail.cdnUrl}
				alt={image.originalFilename}
				class="h-full w-full object-cover transition group-hover:scale-105"
				loading="lazy"
			/>
		{:else}
			<div class="flex h-full items-center justify-center text-gray-600">No preview</div>
		{/if}
	</div>
	<div class="p-3">
		<p class="truncate text-sm text-gray-300">{image.originalFilename}</p>
		<p class="text-xs text-gray-500">{image.originalWidth} x {image.originalHeight}</p>
	</div>
</a>
