<script lang="ts">
	import { appState, toggleDayNightPhase } from '$lib/store/appState';
	import { clearDayNightStatus } from '$lib/store/player';
	import { vibrate } from '$lib/utils/haptics';
	import { _ } from 'svelte-i18n';

	const LONG_PRESS_MS = 650;
	let longPressTimeout: ReturnType<typeof setTimeout> | null = null;
	let longPressTriggered = false;

	const startPress = () => {
		vibrate(10);
		if (longPressTimeout) clearTimeout(longPressTimeout);
		longPressTimeout = setTimeout(() => {
			longPressTriggered = true;
			clearDayNightStatus();
		}, LONG_PRESS_MS);
	};

	const endPress = () => {
		if (longPressTimeout) {
			clearTimeout(longPressTimeout);
			longPressTimeout = null;
		}
	};

	const handleClick = () => {
		if (longPressTriggered) {
			setTimeout(() => {
				longPressTriggered = false;
			}, 50);
			return;
		}
		vibrate(20);
		toggleDayNightPhase();
	};
</script>

<button
	type="button"
	on:mousedown={startPress}
	on:mouseup={endPress}
	on:mouseleave={endPress}
	on:touchstart={startPress}
	on:touchend={endPress}
	on:touchcancel={endPress}
	on:click={handleClick}
	on:contextmenu|preventDefault
	draggable="false"
	title={$_('day_night') ?? 'Day / Night'}
	class="px-2 py-1 rounded-3xl bg-gray-800 text-white min-w-[2.5rem] h-10 flex items-center justify-center gap-1"
>
	<span class="text-lg leading-none">{$appState.dayNightPhase === 'day' ? '☀️' : '🌙'}</span>
</button>
