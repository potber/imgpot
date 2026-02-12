<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>imgpot</title>
</svelte:head>

{@render children()}
