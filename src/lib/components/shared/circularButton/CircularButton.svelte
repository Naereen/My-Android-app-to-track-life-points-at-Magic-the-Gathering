<script lang="ts">
	import { haptic } from '$lib/utils/haptics';
	export let number: number = 0;
	export let highlight = false;
	export let customText = false;
	export const light = false;
	export let small = false;

	let outline = 'bg-[#2d2f30]';
	let outerSize = small ? 'h-7 w-7' : 'h-10 w-10';
	let innerSize = small ? 'h-6 w-6' : 'h-8 w-8';

	if (highlight) {
		outline = 'bg-[#42d5ff]';
	}
</script>

<button class="rounded-full flex justify-center items-center {outline} {outerSize}" on:click use:haptic={12} on:contextmenu|preventDefault draggable="false">
	<div class="rounded-full bg-[#2d2f30] {innerSize}">
		<span class="text-white flex justify-center items-center h-full">
			{#if customText}
				<slot />
			{:else}
				{number}
			{/if}
		</span>
	</div>
</button>
