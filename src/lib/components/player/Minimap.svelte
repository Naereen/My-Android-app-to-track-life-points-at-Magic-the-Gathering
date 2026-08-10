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
	import {
		getCommanderDamageBySourceForPlayer,
		getCommanderDamageTotalFromPlayer,
		players
	} from '$lib/store/player';
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
	export let onSeatSplitClick: ((targetIndex: number, side: 'left' | 'right') => void) | null = null;
	export let onSeatLongPress: ((targetIndex: number) => void) | null = null;
	export let seatLongPressMs = 1000;
    export let fromPlayerDataModal = false;
	export let commanderDamageIndicator: 'total' | 'sum' | 'max' | 'sum-with-max' = 'sum';

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
		// Seat identities are encoded here, not visual positions; later transforms can then
		// reuse one canonical structure for multiple orientations and modal modes.
		switch (playerCount) {
			case 2:
				return [[1, 1], [0, 0]];
			case 3:
				return [[1, 2], [0, 0]];
			case 4:
				return currentLayout === 'two-by-two'
					? [[0, 3], [1, 2]]
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

	const applySymetryByXAxis = (matrix: MinimapMatrix): MinimapMatrix => {
		return [...matrix].reverse();
	};

	const rotateForViewer = (
		matrix: MinimapMatrix,
		viewerOrientation: SeatOrientation,
		isCommanderModal: boolean
	): MinimapMatrix => {
		// Commander modal uses the selected player's perspective as the reference frame,
		// while the in-game minimap uses the board's global orientation.
		if (isCommanderModal) {
            if (viewerOrientation === 'down') {
                return rotate180(matrix);
            }
            else if (viewerOrientation === 'right') {
                if (layout === 'two-by-two' && numberOfPlayers <= 5) {
                    return applySymetryByYAxis(rotateCounterClockwise(matrix));
                } else {
                    return rotateCounterClockwise(matrix);
                }
            }
            else if (viewerOrientation === 'left') {
                if (layout === 'two-by-two' && numberOfPlayers <= 5) {
                    return applySymetryByYAxis(rotateClockwise(matrix));
                } else {
                    return rotateClockwise(matrix);
                }
            }
            return matrix;
        }
		else {
            if (viewerOrientation === 'down') {
                return rotate180(matrix);
            }
            else if (viewerOrientation === 'right') {
                if (layout === 'two-by-two' && numberOfPlayers <= 5) {
                    return rotateClockwise(matrix);
                } else {
                    return applySymetryByYAxis(rotateClockwise(matrix));
                }
            }
            else if (viewerOrientation === 'left') {
                if (layout === 'two-by-two' && numberOfPlayers <= 5) {
                    return applySymetryByYAxis(rotateCounterClockwise(matrix));
                } else {
                    return rotateCounterClockwise(matrix);
                }
            }
            return matrix;
        }
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
		// Converting once here keeps the template declarative and avoids duplicating the
		// seat-shape logic in markup.
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
		if (numberOfPlayers === 4 && layout === 'two-by-two') {
			if (playerIndex === 0 || playerIndex === 1) {
				if (seatOrientation === 'left') { return '0deg'; }
				else if (seatOrientation === 'right') { return '0deg'; }  // FIXME: bug!
				else if (seatOrientation === 'up') { return '0deg'; }
				else if (seatOrientation === 'down') { return '180deg'; }
			}
			else if (playerIndex === 2 || playerIndex === 3) {
				if (seatOrientation === 'left') { return '180deg'; }  // FIXME: bug!
				else if (seatOrientation === 'right') { return '0deg'; }
				else if (seatOrientation === 'up') { return '0deg'; }
				else if (seatOrientation === 'down') { return '180deg'; }
			}
		}

		if (seatOrientation === 'left') {
            return '-90deg';
        }
		else if (seatOrientation === 'right') {
            return '90deg';
        }
        else if (seatOrientation === 'up') {
            return '0deg';
        }
		else if (seatOrientation === 'down') {
            if (numberOfPlayers === 4 && layout === 'one-two-one') {
				if (playerIndex === 2) {
					return '0deg';
				}
				return '180deg';
            } else if (numberOfPlayers === 6 && playerIndex === 3 && layout === 'one-two-one') {
                return '0deg';
            } else {
                return '180deg';
            }
        }
		return '0deg';
	};

	const orientationToDegreesFromDataModal = (seatOrientation: SeatOrientation): string => {
        if (numberOfPlayers === 4 && layout === 'one-two-one') {
            if (playerIndex === 0) {
                if (seatOrientation === 'down') { return '180deg'; }
                else if (seatOrientation === 'up') { return '0deg'; }
                else if (seatOrientation === 'left') { return '-90deg'; }
                else if (seatOrientation === 'right') { return '90deg'; }
                return '0deg';
            } else if (playerIndex === 1) {
                if (seatOrientation === 'down') { return '90deg'; }
                else if (seatOrientation === 'up') { return '-90deg'; }
                else if (seatOrientation === 'left') { return '180deg'; }
                else if (seatOrientation === 'right') { return '0deg'; }
                return '0deg';
            } else if (playerIndex === 2) {
                if (seatOrientation === 'down') { return '0deg'; }
                else if (seatOrientation === 'up') { return '180deg'; }
                else if (seatOrientation === 'left') { return '90deg'; }
                else if (seatOrientation === 'right') { return '-90deg'; }
                return '0deg';
            } else if (playerIndex === 3) {
                if (seatOrientation === 'down') { return '-90deg'; }
                else if (seatOrientation === 'up') { return '90deg'; }
                else if (seatOrientation === 'left') { return '0deg'; }
                else if (seatOrientation === 'right') { return '180deg'; }
                return '0deg';
            }
        }

        if (numberOfPlayers === 4 && layout === 'two-by-two') {
            if (playerIndex === 0 || playerIndex === 1) {
                if (seatOrientation === 'left') { return '180deg'; }
                else if (seatOrientation === 'right') { return '0deg'; }
                return '0deg';
            } else if (playerIndex === 2 || playerIndex === 3) {
                if (seatOrientation === 'left') { return '0deg'; }
                else if (seatOrientation === 'right') { return '-180deg'; }
                return '0deg';
            }
        }

        if (numberOfPlayers === 3) {
            if (playerIndex === 1 || playerIndex === 2) {
                if (seatOrientation === 'left') { return '0deg'; }
                else if (seatOrientation === 'right') { return '180deg'; }
                return '90deg';
            } else if (playerIndex === 0) {
                if (seatOrientation === 'left') { return '0deg'; }
                else if (seatOrientation === 'right') { return '-180deg'; }
                return '0deg';
            }
        }

        // TODO: layout inversé pour 3 joueurs, à traiter !

        if (numberOfPlayers === 5) {
            if (playerIndex === 1 || playerIndex === 2) {
                if (seatOrientation === 'left') { return '180deg'; }
                else if (seatOrientation === 'right') { return '0deg'; }
                return '-90deg';
            } else if (playerIndex === 3 || playerIndex === 4) {
                if (seatOrientation === 'left') { return '0deg'; }
                else if (seatOrientation === 'right') { return '180deg'; }
                return '90deg';
            } else if (playerIndex === 0) {
                if (seatOrientation === 'up') { return '0deg'; }
                else if (seatOrientation === 'down') { return '-180deg'; }
                return '0deg';
            }
        }

        if (numberOfPlayers === 6 && layout === 'two-by-two') {
            if (playerIndex === 0 || playerIndex === 1 || playerIndex === 2) {
                if (seatOrientation === 'left') { return '180deg'; }
                else if (seatOrientation === 'right') { return '0deg'; }
                return '-90deg';
            } else if (playerIndex === 3 || playerIndex === 4 || playerIndex === 5) {
                if (seatOrientation === 'left') { return '0deg'; }
                else if (seatOrientation === 'right') { return '180deg'; }
                return '90deg';
            }
        }

        if (numberOfPlayers === 6 && layout === 'one-two-one') {
            if (playerIndex === 0) {
                if (seatOrientation === 'up') { return '0deg'; }
                else if (seatOrientation === 'down' ) { return '180deg'; }
                else if (seatOrientation === 'left') { return '-90deg'; }
                else if (seatOrientation === 'right') { return '90deg'; }
                return '0deg';
            } else if (playerIndex === 1 || playerIndex === 2) {
                if (seatOrientation === 'left') { return '180deg'; }
                else if (seatOrientation === 'right') { return '0deg'; }
                else if (seatOrientation === 'up') { return '0deg'; }  // XXX: wrong angle by choice
                else if (seatOrientation === 'down') { return '0deg'; }  // XXX: wrong angle by choice
                return '-90deg';
            } else if (playerIndex === 3) {
                if (seatOrientation === 'left') { return '180deg'; }
                else if (seatOrientation === 'right') { return '0deg'; }
                return '90deg';
            } else if (playerIndex === 4 || playerIndex === 5) {
                if (seatOrientation === 'left') { return '0deg'; }
                else if (seatOrientation === 'right') { return '180deg'; }
                else if (seatOrientation === 'up') { return '0deg'; }  // XXX: wrong angle by choice
                else if (seatOrientation === 'down') { return '0deg'; }  // XXX: wrong angle by choice
                return '90deg';
            }
        }

        // XXX: maybe we should clean-up this old code
		if (seatOrientation === 'left') {
            return '-90deg';
        }
		else if (seatOrientation === 'right') {
            return '90deg';
        }
        else if (seatOrientation === 'up') {
            return '0deg';
        }
		else if (seatOrientation === 'down') {
            return '180deg';
        }
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
		const viewerOrientation = orientation ?? seatOrientations[targetIndex] ?? 'up';
		return orientationToDegreesForTileText(viewerOrientation);
	};

	$: minimapWidthRem = fromPlayerDataModal
		? Math.max((orientation === 'right' || orientation === 'left') ? 8.5 : 5.0, minimapColCount * 1.6)
		: Math.max( (orientation === 'right' || orientation === 'left') ? 4 : 5.5, minimapColCount * 1.0);
	$: minimapHeightRem = fromPlayerDataModal
		? Math.max((orientation === 'right' || orientation === 'left') ? 5.5 : 5.0, minimapRowCount * 1.45)
		: Math.max( (orientation === 'right' || orientation === 'left') ? 5.5 : 4.5, minimapRowCount * 1.25);
	$: minimapStyle = `width: ${minimapWidthRem}rem; height: ${minimapHeightRem}rem;`;
	$: minimapGridStyle = `grid-template-rows: repeat(${minimapRowCount}, minmax(0, 1fr)); grid-template-columns: repeat(${minimapColCount}, minmax(0, 1fr));`;
	$: minimapContainerClass = `pointer-events-auto overflow-hidden rounded-md border border-black/70 p-0.5 ${backgroundClass}`;

	$: getTileBackgroundRotation = (targetIndex: number, fromPlayerDataModal: boolean = false): string => {
		const seatOrientation = seatOrientations[targetIndex] ?? 'up';
        if (fromPlayerDataModal) {
            return orientationToDegreesFromDataModal(seatOrientation);
        } else {
			return orientationToDegrees(seatOrientation);
        }
	};

	$: getTileBackgroundLayerClass = (targetIndex: number): string => {
		const bg = $players[targetIndex]?.backgroundImage;
		const rotation = getTileBackgroundRotation(targetIndex, fromPlayerDataModal);
		const isRotation90Deg = (rotation === '90deg' || rotation === '-90deg');
		const baseClass = "relative h-full w-full overflow-hidden";

		if (Array.isArray(bg) && bg.length >= 2) {
			return `${baseClass} before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-cover before:bg-center before:bg-no-repeat before:[background-image:var(--tile-bg-left)] before:[transform:rotate(var(--tile-bg-rotation))] before:[transform-origin:center] after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-1/2 after:bg-cover after:bg-center after:bg-no-repeat after:[background-image:var(--tile-bg-right)] after:[transform:rotate(var(--tile-bg-rotation))] after:[transform-origin:center]`;
		}

		return `${baseClass} before:content-[''] before:absolute before:inset-0 before:bg-center before:bg-no-repeat before:[background-image:var(--tile-bg-image)] before:[background-size:var(--tile-bg-size)] before:[transform:rotate(var(--tile-bg-rotation))] before:[transform-origin:center] after:hidden`;
	};

	$: getBgStyle = (targetIndex: number) => {
		const orientation = seatOrientations[targetIndex] ?? 'up';
		const p = $players[targetIndex];
		const bg = p.backgroundImage;
		let rotation = getTileBackgroundRotation(targetIndex, fromPlayerDataModal);
		if (!fromPlayerDataModal) {
			if (rotation === '180deg') { rotation = '-90deg'; }
			else if (rotation === '-90deg') { rotation = '0deg'; }
			else if (rotation === '90deg') { rotation = '180deg'; }
			else if (rotation === '0deg') { rotation = '90deg'; }
		}
		// const rotation = '0deg';
		if (!p) return '';
		else if (!bg && p.color) return `background: ${colorToBg(p.color)};`;
		else if (Array.isArray(bg) && bg.length >= 2) {
			let [leftImage, rightImage] = bg.slice(0, 2);
			// FIXME: work on that!
			if (
				(orientation === 'up' && rotation === '180deg')
				|| (orientation === 'down' && rotation === '180deg')
			) {
				// Exchange the two images, to fix a bug: their ordering was incorrect in some cases
				[leftImage, rightImage] = [rightImage, leftImage];
			}
			return [
				`--tile-bg-left: url('${leftImage}');`,
				`--tile-bg-right: url('${rightImage}');`,
				`--tile-bg-rotation: ${rotation};`,
			].join(' ');
		}
		else if (Array.isArray(bg) && bg.length === 1)
			return `--tile-bg-image: url('${bg[0]}'); --tile-bg-size: cover; --tile-bg-rotation: ${rotation};`;
		else if (bg && typeof bg === 'string') {
			return `--tile-bg-image: url('${bg}'); --tile-bg-size: cover; --tile-bg-rotation: ${rotation};`;
		}
		return '';
	};

	/*
	$: getCommanderDamage = (targetIndex: number) =>
		getCommanderDamageTotalFromPlayer(
			$players[playerIndex],
			targetIndex + 1,
			$appSettings.playerCount
		);
	*/

	$: getCommanderDamagePair = (targetIndex: number): [number, number] => {
		const bySource = getCommanderDamageBySourceForPlayer($players[playerIndex], $appSettings.playerCount);
		const pair = bySource[targetIndex] ?? [0, 0];
		return [pair[0] ?? 0, pair[1] ?? 0];
	};

	$: isPartnerSourcePlayer = (targetIndex: number): boolean =>
		!!$players[targetIndex]?.statusEffects?.partnerMode;

	$: getEffectiveCommanderDamageIndicator = (targetIndex: number): 'total' | 'sum' | 'max' | 'sum-with-max' => {
		if (
			commanderDamageIndicator === 'sum' &&
			fromPlayerDataModal &&
			isPartnerSourcePlayer(targetIndex)
		) {
			return 'sum';
			// return 'sum-with-max';
		}

		return commanderDamageIndicator;
	};

	$: getCommanderDamageDisplay = (targetIndex: number): string => {
		const [sourceA, sourceB] = getCommanderDamagePair(targetIndex);
		const total = sourceA + sourceB;
		const effectiveIndicator = getEffectiveCommanderDamageIndicator(targetIndex);

		if (effectiveIndicator === 'sum') {
			return sourceB > 0 ? `${sourceA} + ${sourceB}` : `${sourceA}`;
		}

		if (effectiveIndicator === 'sum-with-max') {
			return `${sourceA} + ${sourceB}`;
		}

		if (effectiveIndicator === 'max') {
			return `${Math.max(sourceA, sourceB)}`;
		}

		return `${total}`;
	};

	$: getCommanderDamageMaxDisplay = (targetIndex: number): string => {
		const [sourceA, sourceB] = getCommanderDamagePair(targetIndex);
		return `max=${Math.max(sourceA, sourceB)}`;
	};

	$: shouldShowMe = (targetIndex: number) =>
		targetIndex === playerIndex &&
		getCommanderDamageTotalFromPlayer(
			$players[targetIndex],
			targetIndex + 1,
			$appSettings.playerCount
		) <= 0;

	let seatLongPressTimeout: ReturnType<typeof setTimeout> | null = null;
	let seatLongPressConsumedClick = false;

	/**
	 * Opens player modal from minimap background tap when root is interactive.
	 * @returns {unknown} Result produced by handleRootOpen.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleRootOpen = () => {
		if (!rootClickable) return;
		openPlayerModal(playerIndex + 1, 'commander');
	};

	/**
	 * Routes seat click to split-side callback or regular callback, honoring long-press consumption.
	 * @param {MouseEvent} event - Parameter used by handleSeatClick.
	 * @param {number} targetIndex - Parameter used by handleSeatClick.
	 * @returns {unknown} Result produced by handleSeatClick.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleSeatClick = (event: MouseEvent, targetIndex: number) => {
		if (seatLongPressConsumedClick) {
			seatLongPressConsumedClick = false;
			return;
		}
		if (onSeatSplitClick) {
			event.stopPropagation();
			const target = event.currentTarget as HTMLElement | null;
			if (!target) {
				onSeatSplitClick(targetIndex, 'left');
				return;
			}
			const rect = target.getBoundingClientRect();
			const side: 'left' | 'right' = event.clientX - rect.left < rect.width / 2 ? 'left' : 'right';
			onSeatSplitClick(targetIndex, side);
			return;
		}
		if (!onSeatClick) return;
		event.stopPropagation();
		onSeatClick(targetIndex);
	};

	/**
	 * Starts delayed long-press timer for a seat to open commander edit affordance.
	 * @param {number} targetIndex - Parameter used by startSeatLongPress.
	 * @returns {unknown} Result produced by startSeatLongPress.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
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

	/**
	 * Cancels pending seat long-press timer.
	 * @returns {unknown} Result produced by stopSeatLongPress.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const stopSeatLongPress = () => {
		if (seatLongPressTimeout) {
			clearTimeout(seatLongPressTimeout);
			seatLongPressTimeout = null;
		}
	};

	/**
	 * Provides keyboard activation parity for seat interaction buttons.
	 * @param {KeyboardEvent} event - Parameter used by handleSeatKeydown.
	 * @param {number} targetIndex - Parameter used by handleSeatKeydown.
	 * @returns {unknown} Result produced by handleSeatKeydown.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleSeatKeydown = (event: KeyboardEvent, targetIndex: number) => {
		if (!onSeatClick && !onSeatSplitClick) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.stopPropagation();
			if (onSeatClick) {
				onSeatClick(targetIndex);
			} else if (onSeatSplitClick) {
				onSeatSplitClick(targetIndex, 'left');
			}
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
				title={`${$players[tile.targetIndex]?.playerName ?? ''} (${getCommanderDamageDisplay(tile.targetIndex)}${getEffectiveCommanderDamageIndicator(tile.targetIndex) === 'sum-with-max' ? `, ${getCommanderDamageMaxDisplay(tile.targetIndex)}` : ''})`}
				on:pointerdown={() => startSeatLongPress(tile.targetIndex)}
				on:pointerup={stopSeatLongPress}
				on:pointerleave={stopSeatLongPress}
				on:pointercancel={stopSeatLongPress}
				on:click={(event) => handleSeatClick(event, tile.targetIndex)}
				on:keydown={(event) => handleSeatKeydown(event, tile.targetIndex)}
			>
				<div
					class={getTileBackgroundLayerClass(tile.targetIndex)}
					style={getBgStyle(tile.targetIndex)}
				>
					{#if fromPlayerDataModal && isPartnerSourcePlayer(tile.targetIndex)}
						<span
							class="absolute right-0.5 top-0.5 z-20 rounded bg-black/70 px-0.5 py-0 text-[0.38rem] font-bold uppercase tracking-wide text-amber-200"
							title={$_('partner_mode_label') ?? 'Partner mode'}
						>
							P
						</span>
					{/if}
					<div
						class="relative z-10 flex h-full w-full items-center justify-center px-0.5 text-center text-[0.85rem] font-semibold leading-none text-white"
						style={`transform: rotate(${getTileTextRotation(tile.targetIndex)}); transform-origin: center;`}
					>
						{#if shouldShowMe(tile.targetIndex)}
							<span class="text-[0.60rem]">
                            {meString}
                        </span>
						{:else}
							{#if getEffectiveCommanderDamageIndicator(tile.targetIndex) === 'sum-with-max'}
								<div class="flex flex-col items-center leading-none">
									<span>{getCommanderDamageDisplay(tile.targetIndex)}</span>
									<span class="mt-[1px] text-[0.50rem] opacity-80">{getCommanderDamageMaxDisplay(tile.targetIndex)}</span>
								</div>
							{:else}
								{getCommanderDamageDisplay(tile.targetIndex)}
							{/if}
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>
