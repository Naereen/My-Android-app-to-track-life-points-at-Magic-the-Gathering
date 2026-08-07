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
		layout: 'two-by-two' | 'one-two-one' | '',
        fromPlayerDataModal: boolean = false
	): string => {
        if (fromPlayerDataModal) {
            // FIXME: right now, I've disabled this function if the fromPlayerDataModal flag is enabled: all the cases return '0deg', ie. no rotation
            // TODO: make the whole PlayerDataModal component rotate, instead of just the Minimap!
            return '0deg';
        }

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

	type SeatOrientation = App.Player.Orientation;
	type MinimapMatrix = number[][];
	type MinimapTilePlacement = {
		targetIndex: number;
		rowStart: number;
		rowEnd: number;
		colStart: number;
		colEnd: number;
	};

	const getCanonicalSeatMatrix = (
		playerCount: number,
		currentLayout: 'two-by-two' | 'one-two-one' | ''
	): MinimapMatrix => {
		switch (playerCount) {
			case 2:
				return [[1, 1], [0, 0]];
			case 3:
				return [[1, 2], [0, 0]];
			case 4:
				return currentLayout === 'two-by-two'
					? [[1, 2], [0, 3]]
					: [[2, 2], [1, 3], [0, 0]];
			case 5:
				return [[2, 3], [1, 4], [0, 0]];
			case 6:
				return currentLayout === 'one-two-one'
					? [[3, 3], [2, 4], [1, 5], [0, 0]]
					: [[2, 3], [1, 4], [0, 5]];
			case 7:
				return [[3, 4], [2, 5], [1, 6], [0, 0]];
			case 8:
				return [[4, 4], [3, 5], [2, 6], [1, 7], [0, 0]];
			default:
				return [[0, 0]];
		}
	};

	const rotateClockwise = (matrix: MinimapMatrix): MinimapMatrix => {
		const rows = matrix.length;
		const cols = matrix[0]?.length ?? 0;
		const rotated: MinimapMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));
		for (let r = 0; r < rows; r += 1) {
			for (let c = 0; c < cols; c += 1) {
				rotated[c][rows - 1 - r] = matrix[r][c];
			}
		}
		return rotated;
	};

	const rotateCounterClockwise = (matrix: MinimapMatrix): MinimapMatrix => {
		const rows = matrix.length;
		const cols = matrix[0]?.length ?? 0;
		const rotated: MinimapMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));
		for (let r = 0; r < rows; r += 1) {
			for (let c = 0; c < cols; c += 1) {
				rotated[cols - 1 - c][r] = matrix[r][c];
			}
		}
		return rotated;
	};

	const rotate180 = (matrix: MinimapMatrix): MinimapMatrix => {
		const rows = matrix.length;
		const cols = matrix[0]?.length ?? 0;
		const rotated: MinimapMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));
		for (let r = 0; r < rows; r += 1) {
			for (let c = 0; c < cols; c += 1) {
				rotated[rows - 1 - r][cols - 1 - c] = matrix[r][c];
			}
		}
		return rotated;
	};

	const applySymetryByYAxis = (matrix: MinimapMatrix): MinimapMatrix => {
		return matrix.map((row) => [...row].reverse());
	};

	const rotateForViewer = (
		matrix: MinimapMatrix,
		viewerOrientation: SeatOrientation,
		isCommanderModal: boolean
	): MinimapMatrix => {
		if (isCommanderModal) {
            if (viewerOrientation === 'down')
                return rotate180(matrix);
            return matrix;
        }
		else if (viewerOrientation === 'right') {
            return applySymetryByYAxis(rotateClockwise(matrix));
        }
		else if (viewerOrientation === 'left') {
            return rotateCounterClockwise(matrix);
        }
		else if (viewerOrientation === 'down') {
            return rotate180(matrix);
        }
		return matrix;
	};

	const getThreePlayerViewerMatrix = (viewerIndex: number): MinimapMatrix => {
		if (viewerIndex === 1) return [[1, 0], [2, 0]];
		if (viewerIndex === 2) return [[2, 0], [1, 0]];
		return [[1, 2], [0, 0]];
	};

	const computeTilePlacements = (
		matrix: MinimapMatrix,
		playerCount: number
	): MinimapTilePlacement[] => {
		const placements: MinimapTilePlacement[] = [];
		for (let target = 0; target < playerCount; target += 1) {
			let minRow = Number.POSITIVE_INFINITY;
			let maxRow = Number.NEGATIVE_INFINITY;
			let minCol = Number.POSITIVE_INFINITY;
			let maxCol = Number.NEGATIVE_INFINITY;

			for (let r = 0; r < matrix.length; r += 1) {
				for (let c = 0; c < (matrix[r]?.length ?? 0); c += 1) {
					if (matrix[r][c] !== target) continue;
					minRow = Math.min(minRow, r);
					maxRow = Math.max(maxRow, r);
					minCol = Math.min(minCol, c);
					maxCol = Math.max(maxCol, c);
				}
			}

			if (!Number.isFinite(minRow) || !Number.isFinite(minCol)) continue;

			placements.push({
				targetIndex: target,
				rowStart: minRow + 1,
				rowEnd: maxRow + 2,
				colStart: minCol + 1,
				colEnd: maxCol + 2
			});
		}

		return placements.sort((a, b) =>
			a.rowStart === b.rowStart ? a.colStart - b.colStart : a.rowStart - b.rowStart
		);
	};

	$: canonicalMatrix = getCanonicalSeatMatrix(numberOfPlayers, layout);
	$: minimapMatrix =
		numberOfPlayers === 3 && !fromPlayerDataModal
			? getThreePlayerViewerMatrix(playerIndex)
			: rotateForViewer(canonicalMatrix, orientation, fromPlayerDataModal);
	$: minimapRowCount = minimapMatrix.length;
	$: minimapColCount = minimapMatrix[0]?.length ?? 1;
	$: minimapTiles = computeTilePlacements(minimapMatrix, numberOfPlayers);

	const orientationToDegrees = (seatOrientation: SeatOrientation): string => {
		if (seatOrientation === 'left') return '-90deg';
		if (seatOrientation === 'right') return '90deg';
		if (seatOrientation === 'down') return '180deg';
		return '0deg';
	};

	$: seatOrientations = getSeatOrientations(numberOfPlayers, layout);

	const orientationToDegreesForTileText = (seatOrientation: SeatOrientation): string => {
		if (seatOrientation === 'left') return '180deg';
		if (seatOrientation === 'right') return '0deg';
		if (seatOrientation === 'down') return '0deg';
		return '0deg';
	};

	$: getTileTextRotation = (targetIndex: number): string => {
		if (fromPlayerDataModal) {
			return '0deg';
		}
		const viewerOrientation = orientation ?? seatOrientations[playerIndex] ?? 'up';
		return orientationToDegreesForTileText(viewerOrientation);
	};

	$: minimapWidthRem = fromPlayerDataModal
		? Math.max(5.0, minimapColCount * 1.6)
		: Math.max(
            (orientation === 'right' || orientation === 'left') ? 4 : 5.5,
            minimapColCount * 1.0);
	$: minimapHeightRem = fromPlayerDataModal
		? Math.max(5.0, minimapRowCount * 1.45)
		: Math.max(
            (orientation === 'right' || orientation === 'left') ? 5.5 : 4.5,
            minimapRowCount * 1.25);
	$: minimapStyle = `width: ${minimapWidthRem}rem; height: ${minimapHeightRem}rem;`;
	$: minimapGridStyle = `grid-template-rows: repeat(${minimapRowCount}, minmax(0, 1fr)); grid-template-columns: repeat(${minimapColCount}, minmax(0, 1fr));`;
	$: minimapContainerClass = `pointer-events-auto overflow-hidden rounded-md border border-black/70 p-0.5 ${backgroundClass}`;

	$: getTileBackgroundRotation = (targetIndex: number): string => {
		const seatOrientation = seatOrientations[targetIndex] ?? 'up';
		return orientationToDegrees(seatOrientation);
	};

	$: getTileBackgroundLayerClass = (targetIndex: number): string => {
		const rotation = getTileBackgroundRotation(targetIndex);
		return rotation === '90deg' || rotation === '-90deg' ? 'absolute -inset-1/2' : 'absolute inset-0';
	};

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
	<div class="grid h-full w-full gap-0.5" style={minimapGridStyle}>
		{#each minimapTiles as tile}
			<button
				type="button"
				class={`relative flex h-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-sm border border-black/80 ${backgroundClass}`}
				style={`grid-row: ${tile.rowStart} / ${tile.rowEnd}; grid-column: ${tile.colStart} / ${tile.colEnd};`}
				title={$players[tile.targetIndex]?.playerName}
				on:pointerdown={() => startSeatLongPress(tile.targetIndex)}
				on:pointerup={stopSeatLongPress}
				on:pointerleave={stopSeatLongPress}
				on:pointercancel={stopSeatLongPress}
				on:click={(event) => handleSeatClick(event, tile.targetIndex)}
				on:keydown={(event) => handleSeatKeydown(event, tile.targetIndex)}
			>
				<div
					class={getTileBackgroundLayerClass(tile.targetIndex)}
					style={`${getBgStyle(tile.targetIndex)} transform: rotate(${getTileBackgroundRotation(tile.targetIndex)}); transform-origin: center;`}
				></div>
				<div
					class="relative z-10 text-white text-[10px] leading-none text-center font-semibold px-0.5"
					style={`transform: rotate(${getTileTextRotation(tile.targetIndex)}); transform-origin: center;`}
				>
					{#if shouldShowMe(tile.targetIndex)}
						<span class="text-[8px]">
                            {meString}
                        </span>
					{:else}
						{getCommanderDamage(tile.targetIndex)}
					{/if}
				</div>
			</button>
		{/each}
	</div>
</div>
