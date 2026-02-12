<script lang="ts">
	import CopyButton from './CopyButton.svelte';
	import { bbcodeImage, bbcodeClickToEnlarge } from '$lib/utils/bbcode';

	interface Variation {
		variationType: string;
		cdnUrl: string;
		width: number;
		height: number;
		sizeBytes: number;
	}

	interface Props {
		variations: Variation[];
	}

	let { variations }: Props = $props();

	const original = $derived(variations.find((v) => v.variationType === 'original'));
	const large = $derived(variations.find((v) => v.variationType === 'large'));
	const medium = $derived(variations.find((v) => v.variationType === 'medium'));
	const small = $derived(variations.find((v) => v.variationType === 'small'));

	const clickToEnlargeBBCode = $derived(
		original && medium ? bbcodeClickToEnlarge(original.cdnUrl, medium.cdnUrl) : ''
	);
</script>

<div class="space-y-4">
	<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">URLs & BBCode</h3>

	{#each variations as variation}
		<div class="rounded-lg bg-gray-800 p-3">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-300 capitalize">{variation.variationType}</span>
				<span class="text-xs text-gray-500">{variation.width}x{variation.height}</span>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="text"
					value={variation.cdnUrl}
					readonly
					class="flex-1 rounded bg-gray-900 px-2 py-1 text-xs text-gray-400 focus:outline-none"
				/>
				<CopyButton text={variation.cdnUrl} label="URL" />
				<CopyButton text={bbcodeImage(variation.cdnUrl)} label="BBCode" />
			</div>
		</div>
	{/each}

	{#if clickToEnlargeBBCode}
		<div class="rounded-lg bg-gray-800 p-3">
			<div class="mb-2">
				<span class="text-sm font-medium text-gray-300">Click-to-enlarge BBCode</span>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="text"
					value={clickToEnlargeBBCode}
					readonly
					class="flex-1 rounded bg-gray-900 px-2 py-1 text-xs text-gray-400 focus:outline-none"
				/>
				<CopyButton text={clickToEnlargeBBCode} />
			</div>
		</div>
	{/if}
</div>
