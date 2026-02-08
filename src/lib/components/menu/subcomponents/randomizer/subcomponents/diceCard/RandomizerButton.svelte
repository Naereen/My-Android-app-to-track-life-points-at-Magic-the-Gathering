<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let text = '';

	const dispatch = createEventDispatcher();

	let pressTimer: number | null = null;
	const longPressDuration = 600; // ms

	const startPress = (event: PointerEvent) => {
		// only left button
		if ((event as PointerEvent).button && (event as PointerEvent).button !== 0) return;
		cancelPress();
		// @ts-ignore - window.setTimeout returns number
		pressTimer = window.setTimeout(() => {
			dispatch('longpress');
			pressTimer = null;
		}, longPressDuration) as unknown as number;
	};

	const cancelPress = () => {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	};
</script>

<div class="w-24 h-24 rounded-[3rem]">
	<button
		on:click
		on:contextmenu|preventDefault
		on:pointerdown|passive={startPress}
		on:pointerup={cancelPress}
		on:pointercancel={cancelPress}
		on:pointerleave={cancelPress}
		on:touchstart|passive={startPress}
		on:touchend={cancelPress}
		draggable="false"
		class="bg-[#2d2f30] w-24 h-24 rounded-3xl flex justify-center items-center"
	>
		<slot />
	</button>
	<p class="text-center text-sm mt-1" style="font-size: 1.1rem;">{text}</p>
</div>
