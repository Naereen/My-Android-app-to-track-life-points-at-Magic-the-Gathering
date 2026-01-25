<script>
	import '../app.css';

	$: innerHeight = 0;
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

<svelte:window bind:innerHeight contextmenu="return false" />

<!-- outer full-width container avoids visible body background at the sides -->
<div class="w-full max-h-screen font-sans flex justify-center overflow-hidden">
	<div
		class="mx-auto max-w-[1000px] flex justify-center w-full"
		style="height: {innerHeight}px;"
	>
		<slot />
	</div>
</div>
