<script lang="ts">
	import { copyToClipboard } from '$lib/utils/clipboard';

	interface Props {
		text: string;
		label?: string;
	}

	let { text, label = 'Copy' }: Props = $props();
	let copied = $state(false);

	async function handleCopy() {
		const success = await copyToClipboard(text);
		if (success) {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<button
	onclick={handleCopy}
	class="rounded bg-gray-700 px-3 py-1 text-sm text-gray-300 transition hover:bg-gray-600"
>
	{copied ? 'Copied!' : label}
</button>
