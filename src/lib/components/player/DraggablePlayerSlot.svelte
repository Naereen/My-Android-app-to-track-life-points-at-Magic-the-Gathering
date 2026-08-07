<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import touchDrag from '$lib/actions/touchDrag';
	import { swapPlayersSeats } from '$lib/store/player';
	import { vibrate } from '$lib/utils/haptics';

	export let seatId: number;
	export let className = 'w-full h-full';
	export let longPressMs = 260;

	type DragStatePayload = {
		active: boolean;
		fromSeatIndex: number | null;
		hoveredSeatIndex: number | null;
	};

	const DRAG_STATE_EVENT = 'mtg-seat-drag-state';

	let slotEl: HTMLDivElement;
	let isDragging = false;
	let dragFromSeatIndex: number | null = null;
	let hoveredSeatIndex: number | null = null;
	let lastHapticTargetIndex: number | null = null;

	const isTouchDevice =
		typeof navigator !== 'undefined' &&
		((navigator as any).maxTouchPoints > 0 ||
			(typeof matchMedia !== 'undefined' && matchMedia('(pointer:coarse)').matches));

	$: seatIndex = Math.max(0, seatId - 1);
	$: isDropTarget = isDragging && hoveredSeatIndex === seatIndex && dragFromSeatIndex !== seatIndex;
	$: isDragSource = isDragging && dragFromSeatIndex === seatIndex;

	const publishDragState = (
		active: boolean,
		fromSeatIndex: number | null,
		hoveredSeatIndex: number | null
	) => {
		if (typeof window === 'undefined') return;
		window.dispatchEvent(
			new CustomEvent<DragStatePayload>(DRAG_STATE_EVENT, {
				detail: {
					active,
					fromSeatIndex,
					hoveredSeatIndex
				}
			})
		);
	};

	const onGlobalDragState = (event: Event) => {
		const customEvent = event as CustomEvent<DragStatePayload>;
		isDragging = customEvent.detail.active;
		dragFromSeatIndex = customEvent.detail.fromSeatIndex;
		hoveredSeatIndex = customEvent.detail.hoveredSeatIndex;
	};

	onMount(() => {
		if (slotEl) {
			slotEl.addEventListener('dragstart', handleDragStart as EventListener);
			slotEl.addEventListener('dragmove', handleDragMove as EventListener);
			slotEl.addEventListener('dragend', handleDragEnd as EventListener);
		}

		if (typeof window === 'undefined') return;
		window.addEventListener(DRAG_STATE_EVENT, onGlobalDragState as EventListener);

		return () => {
			if (slotEl) {
				slotEl.removeEventListener('dragstart', handleDragStart as EventListener);
				slotEl.removeEventListener('dragmove', handleDragMove as EventListener);
				slotEl.removeEventListener('dragend', handleDragEnd as EventListener);
			}
			window.removeEventListener(DRAG_STATE_EVENT, onGlobalDragState as EventListener);
		};
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.removeEventListener(DRAG_STATE_EVENT, onGlobalDragState as EventListener);
	});

	const getLayoutContainer = () => {
		if (!slotEl) return document.body as HTMLElement;
		return (slotEl.closest('[data-dnd-layout]') as HTMLElement | null) ??
			(document.body as HTMLElement);
	};

	const findClosestSeatIndex = (x: number, y: number): number | null => {
		const container = getLayoutContainer();
		const slots = Array.from(
			container.querySelectorAll<HTMLElement>('[data-player-seat-index]')
		);
		if (slots.length === 0) return null;

		let closestIndex: number | null = null;
		let closestDistance = Number.POSITIVE_INFINITY;

		for (const slot of slots) {
			const raw = slot.getAttribute('data-player-seat-index');
			if (raw === null) continue;
			const idx = Number(raw);
			if (!Number.isFinite(idx)) continue;

			const rect = slot.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = x - cx;
			const dy = y - cy;
			const distance = dx * dx + dy * dy;

			if (distance < closestDistance) {
				closestDistance = distance;
				closestIndex = idx;
			}
		}

		return closestIndex;
	};

	const handleDragEnd = (event: Event) => {
		const customEvent = event as CustomEvent<{ x: number; y: number }>;
		const toIndex = findClosestSeatIndex(customEvent.detail.x, customEvent.detail.y);
		if (toIndex !== null && toIndex !== seatIndex) {
			swapPlayersSeats(seatIndex, toIndex);
		}
		lastHapticTargetIndex = null;
		publishDragState(false, null, null);
	};

	const handleDragStart = () => {
		lastHapticTargetIndex = seatIndex;
		publishDragState(true, seatIndex, seatIndex);
	};

	const handleDragMove = (event: Event) => {
		const customEvent = event as CustomEvent<{ x: number; y: number }>;
		const toIndex = findClosestSeatIndex(customEvent.detail.x, customEvent.detail.y);
		const nextTarget = toIndex ?? seatIndex;
		if (nextTarget !== lastHapticTargetIndex) {
			lastHapticTargetIndex = nextTarget;
			vibrate(30);
		}
		publishDragState(true, seatIndex, nextTarget);
	};
</script>

{#if isTouchDevice}
	<div
		bind:this={slotEl}
		class={className}
		class:dnd-drop-target={isDropTarget}
		class:dnd-drag-source={isDragSource}
		data-player-seat-index={seatIndex}
		use:touchDrag={{ handle: '.beleren', longPressMs }}
	>
		<slot />
	</div>
{:else}
	<div
		bind:this={slotEl}
		class={className}
		class:dnd-drop-target={isDropTarget}
		class:dnd-drag-source={isDragSource}
		data-player-seat-index={seatIndex}
	>
		<slot />
	</div>
{/if}

<style>
	[data-player-seat-index] {
		transform-origin: center;
		will-change: transform, box-shadow, opacity;
		transition:
			transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 120ms ease;
	}

	.dnd-drop-target {
		transform: rotate(12deg) scale(1.02);
		box-shadow:
			inset 0 0 0 4px rgba(125, 211, 252, 0.92),
			0 0 24px rgba(56, 189, 248, 0.45),
			0 0 44px rgba(14, 165, 233, 0.25);
		border-radius: 12px;
		animation: dndTargetPulse 360ms ease-in-out infinite alternate;
	}

	.dnd-drag-source {
		opacity: 0.93;
	}

	@keyframes dndTargetPulse {
		from {
			box-shadow:
				inset 0 0 0 4px rgba(125, 211, 252, 0.86),
				0 0 20px rgba(56, 189, 248, 0.36),
				0 0 36px rgba(14, 165, 233, 0.2);
		}
		to {
			box-shadow:
				inset 0 0 0 4px rgba(125, 211, 252, 1),
				0 0 28px rgba(56, 189, 248, 0.52),
				0 0 50px rgba(14, 165, 233, 0.32);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dnd-drop-target {
			transform: scale(1.01);
			animation: none;
		}
	}
</style>
