<script lang="ts">
	import { tap } from '$lib/utils/haptics';
	export let type: 'light' | 'dark' = 'light';

	const handleClick = (e: MouseEvent) => {
		// light haptic on generic button click
		tap(10);
	};
</script>

<button
	on:click={handleClick}
	on:contextmenu|preventDefault
	draggable="false"
	class="no-longpress border rounded-md px-2 w-20 {type === 'light'
		? 'bg-[#2d2f30]'
		: 'bg-[#2d2f30] border-red-500'}">
	<slot />
</button>

