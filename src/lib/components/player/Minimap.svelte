<script context="module" lang="ts">
	export const getBackgroundViewerRotation = (
		playerIndex: number,
		numberOfPlayers: number,
		layout: 'two-by-two' | 'one-two-one' | ''
	): string => {
		if (numberOfPlayers === 3) {
			if (playerIndex === 1) return '90deg';
			if (playerIndex === 2) return '-90deg';
			return '0deg';
		}

		if (numberOfPlayers === 4 && layout === 'two-by-two') {
			if (playerIndex === 1) return '90deg';
			if (playerIndex === 2) return '-90deg';
			if (playerIndex === 3) return '-90deg';
			return '90deg';
		}
		if (numberOfPlayers === 4 && layout === 'one-two-one') {
			if (playerIndex === 1) return '90deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '-90deg';
			return '0deg';
		}

		if (numberOfPlayers === 5) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '180deg';
			if (playerIndex === 4) return '180deg';
			return '0deg';
		}

		if (numberOfPlayers === 6 && layout === 'two-by-two') {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '0deg';
			if (playerIndex === 5) return '0deg';
			return '0deg';
		}
		if (numberOfPlayers === 6 && layout === 'one-two-one') {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			return '0deg';
		}

		if (numberOfPlayers === 7) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			if (playerIndex === 6) return '180deg';
			return '0deg';
		}

		if (numberOfPlayers === 8) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			if (playerIndex === 6) return '180deg';
			if (playerIndex === 7) return '180deg';
			return '0deg';
		}

		return '0deg';
	};

    // Second try
	export const getBackgroundViewerRotationInCommanderDamage = (
		playerIndex: number,
		numberOfPlayers: number,
		layout: 'two-by-two' | 'one-two-one' | ''
	): string => {
		if (numberOfPlayers === 3) {
			if (playerIndex === 1) return '-90deg';
			if (playerIndex === 2) return '90deg';
			return '0deg';
		}

		if (numberOfPlayers === 4 && layout === 'two-by-two') {
			if (playerIndex === 1) return '90deg';
			if (playerIndex === 2) return '90deg';
			if (playerIndex === 3) return '90deg';
			return '90deg';
		}
		if (numberOfPlayers === 4 && layout === 'one-two-one') {
			if (playerIndex === 1) return '-90deg';
			if (playerIndex === 2) return '-180deg';
			if (playerIndex === 3) return '90deg';
			return '0deg';
		}

		if (numberOfPlayers === 5) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '180deg';
			if (playerIndex === 4) return '180deg';
			return '0deg';
		}

		if (numberOfPlayers === 6 && layout === 'two-by-two') {
			if (playerIndex === 1) return '90deg';
			if (playerIndex === 2) return '90deg';
			if (playerIndex === 3) return '-90deg';
			if (playerIndex === 4) return '-90deg';
			if (playerIndex === 5) return '-90deg';
			return '90deg';
		}
		if (numberOfPlayers === 6 && layout === 'one-two-one') {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			return '0deg';
		}

		if (numberOfPlayers === 7) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			if (playerIndex === 6) return '180deg';
			return '0deg';
		}

		if (numberOfPlayers === 8) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			if (playerIndex === 6) return '180deg';
			if (playerIndex === 7) return '180deg';
			return '0deg';
		}

		return '0deg';
	};

    // Orientation

    type SeatOrientation = App.Player.Orientation;

	export const getSeatOrientations = (
		playerCount: number,
		currentLayout: 'two-by-two' | 'one-two-one' | ''
	): SeatOrientation[] => {
		switch (playerCount) {
			case 2:
				return ['up', 'down'];
			case 3:
				return ['up', 'right', 'left'];
			case 4:
				return currentLayout === 'two-by-two'
					? ['right', 'right', 'left', 'left']
					: ['up', 'right', 'down', 'left'];
			case 5:
				return ['up', 'right', 'right', 'left', 'left'];
			case 6:
				return currentLayout === 'one-two-one'
					? ['up', 'right', 'right', 'down', 'left', 'left']
					: ['right', 'right', 'right', 'left', 'left', 'left'];
			case 7:
				return ['up', 'right', 'right', 'right', 'left', 'left', 'left'];
			case 8:
				return ['up', 'right', 'right', 'right', 'down', 'left', 'left', 'left'];
			default:
				return ['up', 'down'];
		}
	};
</script>

<script lang="ts">
	import { players } from '$lib/store/player';
	import { appSettings } from '$lib/store/appSettings';
	import { _ } from 'svelte-i18n';
	import { openPlayerModal } from '$lib/store/modal';
	import { colorToBg } from '$lib/components/colorToBg';

	export let playerIndex: number;
	export let layout: 'two-by-two' | 'one-two-one' | '' = '';
	export let orientation: App.Player.Orientation = 'up';
	export let backgroundClass = 'bg-black/70';
	export let rootClickable = true;
	export let onSeatClick: ((targetIndex: number) => void) | null = null;
	export let onSeatLongPress: ((targetIndex: number) => void) | null = null;
	export let seatLongPressMs = 1000;
    export let fromPlayerDataModal = false;

	$: numberOfPlayers = $appSettings.playerCount;
	$: meString = String($_('me')); // Keep translated "me" label reactive on locale changes.

	type MinimapRows = number[][];

	const getMinimapRows = (
		playerId: number,
		playerCount: number,
		currentLayout: 'two-by-two' | 'one-two-one' | '',
        fromPlayerDataModal: boolean = false,
	): MinimapRows => {
		switch (playerCount) {
			case 2:
				return [[1], [0]];
			case 3:
				if (playerId === 0) return [[1, 2], [0]];
				else if (playerId === 1) return [[1], [2, 0]];
				else if (playerId === 2) return [[2], [1, 0]];
				else return [];
			case 4:
                if (fromPlayerDataModal) {
                    if (currentLayout === 'two-by-two') {
                        if (playerId === 0)
                            return [[2, 3], [1, 0]];
                        else if (playerId === 1)
                            return [[2, 3], [1, 0]];
                        else if (playerId === 2)
                            return [[2, 3], [1, 0]];
                        else if (playerId === 3)
                            return [[2, 3], [1, 0]];
                        else return [];
                    } else {
                        if (playerId === 0) return [[2], [1, 3], [0]];
                        else if (playerId === 1) return [[1], [2, 0], [3]];
                        else if (playerId === 2) return [[0], [3, 1], [2]];
                        else if (playerId === 3) return [[3], [2, 0], [1]];
                        else return [];
                    }
                } else {
                    if (currentLayout === 'two-by-two') {
                        if (playerId === 0)
                            return [[1, 0], [2, 3]];
                        else if (playerId === 1)
                            return [[1, 0], [2, 3]];
                        else if (playerId === 2)
                            return [[2, 3], [1, 0]];
                        else if (playerId === 3)
                            return [[2, 3], [1, 0]];
                        else return [];
                    } else {
                        if (playerId === 0) return [[2], [1, 3], [0]];
                        else if (playerId === 1) return [[1], [2, 0], [3]];
                        else if (playerId === 2) return [[0], [3, 1], [2]];
                        else if (playerId === 3) return [[3], [2, 0], [1]];
                        else return [];
                    }
                }
			case 5:
                if (playerId === 0) return [[2, 3], [1, 4], [0]];
                else if (playerId === 1) return [[1], [2, 0], [3, 4]];
                else if (playerId === 2) return [[2], [1, 0], [3, 4]];
                else if (playerId === 3) return [[3], [4, 0], [2, 1]];
                else if (playerId === 4) return [[4], [3, 0], [2, 1]];
                else return [];
			case 6:
				if (currentLayout === 'one-two-one') {
                    if (playerId === 0) return [[3], [1, 4], [2, 5], [0]];
                    else if (playerId === 1) return [[1], [2, 0], [3, 5], [4]];
                    else if (playerId === 2) return [[2], [3, 1], [4, 0], [5]];
                    else if (playerId === 3) return [[0], [5, 1], [4, 2], [3]];
                    else if (playerId === 4) return [[4], [3, 5], [2, 0], [1]];
                    else if (playerId === 5) return [[5], [4, 0], [3, 1], [2]];
                    else return [];
                } else {
                    if (fromPlayerDataModal) {
                        if (playerId <= 2) {
                            return [[3, 4, 5], [2, 1, 0]];
                        } else {
                            return [[0, 1, 2], [5, 4, 3]];
                        }
                    } else {
                        if (playerId <= 2) {
                            return [[2, 1, 0], [3, 4, 5]];
                        } else {
                            return [[3, 4, 5], [2, 1, 0]];
                        }
                    }
                }
			case 7:
                if (playerId === 0) return [[3, 4], [2, 5], [1, 6], [0]];
                else if (playerId === 1) return [[1], [2, 0], [3, 6], [4, 5]];
                else if (playerId === 2) return [[2], [3, 1], [4, 0], [5, 6]];
                else if (playerId === 3) return [[3], [4, 2], [5, 1], [6, 0]];
                else if (playerId === 4) return [[4], [5, 3], [6, 2], [0, 1]];
                else if (playerId === 5) return [[5], [6, 4], [0, 3], [1, 2]];
                else if (playerId === 6) return [[6], [0, 5], [1, 4], [2, 3]];
                else return [];
            case 8:
                // TODO: finish this mode manually at first!
                if (playerId === 0) return [[4], [3, 5], [2, 6], [1, 7], [0]];
                else if (playerId === 1) return [[1], [2, 0], [3, 7], [4, 6], [5]];
                else if (playerId === 2) return [[2], [3, 1], [4, 0], [5, 7], [6]];
                else if (playerId === 3) return [[3], [4, 2], [5, 1], [6, 0], [7]];
                else if (playerId === 4) return [[0], [7, 1], [6, 2], [5, 3], [4]];
                else if (playerId === 5) return [[5], [6, 4], [7, 3], [0, 2], [1]];
                else if (playerId === 6) return [[6], [7, 5], [0, 4], [1, 3], [2]];
                else if (playerId === 7) return [[7], [0, 6], [1, 5], [2, 4], [3]];
                else return [];
			default:
				return [];
		}
	};

	$: minimapRows = getMinimapRows(playerIndex, numberOfPlayers, layout, fromPlayerDataModal);

	const orientationToDegrees = (seatOrientation: SeatOrientation): string => {
		if (seatOrientation === 'left') return '-90deg';
		if (seatOrientation === 'right') return '90deg';
		if (seatOrientation === 'down') return '180deg';
		return '0deg';
	};

	$: seatOrientations = getSeatOrientations(numberOfPlayers, layout);

	$: getTileRotation = (targetIndex: number): string => {
		const seatOrientation = seatOrientations[targetIndex] ?? 'up';
		return orientationToDegrees(seatOrientation);
	};

	$: getViewerRotation = (): string => {
		// Custom convention requested for the 3-player layout.
		// Player 1 => normal, player 2 => left, player 3 => right.
		if (numberOfPlayers === 3) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '180deg';
			return '0deg';
		}

		// Custom convention requested for the 4-player layout.
		// Player 1 => normal, player 2 => left, player 3 => right, player 4 => upside down.
		if (numberOfPlayers === 4 && layout === 'two-by-two') {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '180deg';
			if (playerIndex === 3) return '180deg';
			return '0deg';
		}
		if (numberOfPlayers === 4 && layout === 'one-two-one') {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '180deg';
			return '0deg';
		}

		// Custom convention requested for the 5-player layout.
		if (numberOfPlayers === 5) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '180deg';
			if (playerIndex === 4) return '180deg';
			return '0deg';
		}

		// Custom convention requested for the 6-player layout.
		if (numberOfPlayers === 6 && layout === 'two-by-two') {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '0deg';
			if (playerIndex === 5) return '0deg';
			return '0deg';
		}
		if (numberOfPlayers === 6 && layout === 'one-two-one') {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			return '0deg';
		}

		// Custom convention requested for the 7-player layout.
		if (numberOfPlayers === 7) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			if (playerIndex === 6) return '180deg';
			return '0deg';
		}

		// Custom convention requested for the 8-player layout.
		if (numberOfPlayers === 8) {
			if (playerIndex === 1) return '0deg';
			if (playerIndex === 2) return '0deg';
			if (playerIndex === 3) return '0deg';
			if (playerIndex === 4) return '180deg';
			if (playerIndex === 5) return '180deg';
			if (playerIndex === 6) return '180deg';
			if (playerIndex === 7) return '180deg';
			return '0deg';
		}

		// Fallback for other layouts: keep previous seat-based behavior.
		return getTileRotation(playerIndex);
	};

	$: backgroundRotation = getBackgroundViewerRotation(playerIndex, numberOfPlayers, layout);
	$: isQuarterTurn = backgroundRotation === '90deg' || backgroundRotation === '-90deg';
	$: backgroundLayerClass = isQuarterTurn ? 'absolute -inset-1/2' : 'absolute inset-0';
	$: isHorizontalOrientation = orientation === 'up' || orientation === 'down';
	$: minimapWidthRem =
		(orientation === 'left' || orientation === 'right')
			? numberOfPlayers >= 3
				? (fromPlayerDataModal ? 7.0 : 4.0)
				: (fromPlayerDataModal ? 5.0 : 3.0)
			: (fromPlayerDataModal ? 5.0 : 5.0);
	$: minimapHeightRem = isHorizontalOrientation
		? numberOfPlayers <= 3
			? Math.max(4.1, minimapRows.length * 1.75)
			: Math.max(3.5, minimapRows.length * 1.3)
		: Math.max(5.5, minimapRows.length * 1.15);
	$: minimapStyle = `width: ${minimapWidthRem}rem; height: ${minimapHeightRem}rem;`;
	$: rowsStyle = `grid-template-rows: repeat(${minimapRows.length}, minmax(0, 1fr));`;
	$: minimapContainerClass = `pointer-events-auto overflow-hidden rounded-md border border-black/70 p-0.5 ${backgroundClass}`;

	$: getBgStyle = (j: number) => {
		const p = $players[j];
		if (!p) return '';
		const bg = p.backgroundImage;
		if (!bg && p.color) return `background: ${colorToBg(p.color)};`;
		if (Array.isArray(bg) && bg.length === 1)
			return `background-image: url('${bg[0]}'); background-size: cover; background-repeat: no-repeat; background-position: center;`;
		if (Array.isArray(bg) && bg.length === 2)
			return `background-image: url('${bg[0]}'), url('${bg[1]}'); background-size: cover, cover; background-repeat: no-repeat; background-position: center;`;
		if (bg && typeof bg === 'string')
			return `background-image: url('${bg}'); background-size: cover; background-repeat: no-repeat; background-position: center;`;
		return '';
	};

	$: getCommanderDamage = (targetIndex: number) =>
		$players[playerIndex]?.statusEffects?.commanderDamage?.[targetIndex] ?? 0;

	$: shouldShowMe = (targetIndex: number) =>
		targetIndex === playerIndex &&
		($players[targetIndex]?.statusEffects?.commanderDamage?.[targetIndex] ?? -1) <= 0;

	let seatLongPressTimeout: ReturnType<typeof setTimeout> | null = null;
	let seatLongPressConsumedClick = false;

	const handleRootOpen = () => {
		if (!rootClickable) return;
		openPlayerModal(playerIndex + 1, 'commander');
	};

	const handleSeatClick = (event: MouseEvent, targetIndex: number) => {
		if (seatLongPressConsumedClick) {
			seatLongPressConsumedClick = false;
			return;
		}
		if (!onSeatClick) return;
		event.stopPropagation();
		onSeatClick(targetIndex);
	};

	const startSeatLongPress = (targetIndex: number) => {
		if (!onSeatLongPress) return;
		if (seatLongPressTimeout) {
			clearTimeout(seatLongPressTimeout);
			seatLongPressTimeout = null;
		}
		seatLongPressTimeout = setTimeout(() => {
			seatLongPressConsumedClick = true;
			onSeatLongPress(targetIndex);
		}, seatLongPressMs);
	};

	const stopSeatLongPress = () => {
		if (seatLongPressTimeout) {
			clearTimeout(seatLongPressTimeout);
			seatLongPressTimeout = null;
		}
	};

	const handleSeatKeydown = (event: KeyboardEvent, targetIndex: number) => {
		if (!onSeatClick) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.stopPropagation();
			onSeatClick(targetIndex);
		}
	};
</script>

<div
	class={minimapContainerClass}
	style={minimapStyle}
	role="button"
	tabindex="0"
	on:click={handleRootOpen}
	on:keydown={(e) => {
		if ((e.key === 'Enter' || e.key === ' ') && rootClickable) {
			e.preventDefault();
			handleRootOpen();
		}
	}}
>
	<div class="grid h-full w-full gap-0.5" style={rowsStyle}>
		{#each minimapRows as row}
			<div
				class="grid min-h-0 w-full gap-0.5"
				style={`grid-template-columns: repeat(${row.length}, minmax(0, 1fr));`}
			>
				{#each row as targetIndex}
					<button
						type="button"
						class={`relative flex h-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-sm border border-black/80 ${backgroundClass}`}
						title={$players[targetIndex]?.playerName}
						on:pointerdown={() => startSeatLongPress(targetIndex)}
						on:pointerup={stopSeatLongPress}
						on:pointerleave={stopSeatLongPress}
						on:pointercancel={stopSeatLongPress}
						on:click={(event) => handleSeatClick(event, targetIndex)}
						on:keydown={(event) => handleSeatKeydown(event, targetIndex)}
					>
						<div
							class={backgroundLayerClass}
							style={`${getBgStyle(targetIndex)} transform: rotate(${backgroundRotation}); transform-origin: center;`}
						></div>
						<div
							class="relative z-10 text-white text-[10px] leading-none text-center font-semibold px-0.5"
							style={`transform: rotate(${getViewerRotation()});`}
						>
							{#if shouldShowMe(targetIndex)}
								{meString}
							{:else}
								{getCommanderDamage(targetIndex)}
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>
