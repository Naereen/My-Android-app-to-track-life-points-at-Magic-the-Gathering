<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let text = '';

	const dispatch = createEventDispatcher();

	let pressTimer: number | null = null;
	const longPressDuration = 600; // ms

	// This button is oversized on purpose so the long-press gesture stays easy to hit.

	/**
	 * Starts long-press timer and dispatches `longpress` event when threshold is reached.
	 * @param {PointerEvent} event - Parameter used by startPress.
	 * @returns {unknown} Result produced by startPress.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
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

	/**
	 * Cancels pending long-press timer on pointer/touch release or cancellation.
	 * @returns {unknown} Result produced by cancelPress.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
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
	<p class="text-center text-sm mt-1" style="font-size: 1.05rem;">{text}</p>
</div>
