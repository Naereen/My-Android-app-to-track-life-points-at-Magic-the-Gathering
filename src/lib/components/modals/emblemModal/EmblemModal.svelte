<script lang="ts">
	import touchDragMeeple from '$lib/actions/touchDragMeeple';
	import { appSettings } from '$lib/store/appSettings';
	import { players } from '$lib/store/player';
	import {
		emblemModalOpen,
		emblemState,
		closeSelectedEmblem,
		setDungeonMeeplePosition,
		getDungeonMeeplePosition,
		type DungeonMeeplePosition,
		forceDungeonMeeplesRedraw
	} from '$lib/store/emblem';
	import { LIFE_HISTORY_CHART_COLORS } from '$lib/store/lifeHistory';
	import { playGameplaySound } from '$lib/utils/gameplaySound';
	import { vibrate } from '$lib/utils/haptics';
	import { _ } from 'svelte-i18n';

	let currentFaceIndex = 0;
	let wasOpen = false;
	let dungeonBoardEl: HTMLDivElement | null = null;
	let activeDungeonDragPlayerId: number | null = null;
	let activeDungeonDragPosition: DungeonMeeplePosition | null = null;
	let activeDungeonDragStartPosition: DungeonMeeplePosition | null = null;
	let activeDungeonDragOffsetPx: { x: number; y: number } | null = null;
	let selectedDungeonMeeples: Record<number, DungeonMeeplePosition> = {};

	const markerStroke = '#e5e7eb';

	$: selected = $emblemState.selected;
	$: faces = selected?.faces ?? [];
	$: currentFace = faces[currentFaceIndex] ?? null;
	$: activePlayers = ($players ?? []).slice(0, $appSettings.playerCount);
	$: isDungeonCard = Boolean(selected?.faces?.some((face) => /dungeon/i.test(face.typeLine ?? '')));
	$: selectedDungeonId = isDungeonCard ? (selected?.id ?? null) : null;
	$: selectedDungeonMeeples = selectedDungeonId
		? ($emblemState.dungeonMeeples?.[selectedDungeonId] ?? {})
		: {};

	$: if ($emblemModalOpen && !wasOpen) {
		currentFaceIndex = 0;
		wasOpen = true;
	}

	$: if (!selectedDungeonId) {
		activeDungeonDragPlayerId = null;
		activeDungeonDragPosition = null;
		activeDungeonDragStartPosition = null;
		activeDungeonDragOffsetPx = null;
	}

	$: if (!$emblemModalOpen && wasOpen) {
		wasOpen = false;
	}

	/**
	 * Returns SVG polygon points for non-circle/non-square meeple markers.
	 * @param {number} kind Marker kind index.
	 * @param {number} size Base polygon size.
	 * @returns {string} SVG polygon points string.
	 */
	const markerPolygonPoints = (kind: number, size: number) => {
		switch (kind % 8) {
			case 2:
				return `0,-${size} ${size},0 0,${size} -${size},0`;
			case 3:
				return `0,-${size} ${size},${size} -${size},${size}`;
			case 4:
				return `${-size},-${size / 2} ${size},-${size / 2} ${size},${size / 2} ${-size},${size / 2}`;
			case 5:
				return `0,-${size} ${size},-${size / 4} ${size / 2},${size} -${size / 2},${size} -${size},-${size / 4}`;
			case 6:
				return `0,-${size} ${size},-${size / 3} ${size},${size / 3} 0,${size} -${size},${size / 3} -${size},-${size / 3}`;
			case 7:
				return `0,-${size} ${size},0 ${size / 2},${size} -${size / 2},${size} -${size},0`;
			default:
				return '';
		}
	};

	/**
	 * Computes a stable default meeple location when a player has not moved yet.
	 * @param {number} index Player index inside the active player list.
	 * @param {number} total Total number of visible players.
	 * @returns {DungeonMeeplePosition} Normalized fallback position.
	 */
	const getDefaultMeeplePosition = (index: number, total: number): DungeonMeeplePosition => {
		if (total <= 0) {
			return { x: 0.5, y: 1 / 6.5 };
		}

		// First-time positions: one horizontal row at 1/7 from top, evenly spaced.
		const x = (index + 1) / (total + 1);
		const y = 1 / 6.5;

		return { x, y };
	};

	/**
	 * Resolves the current normalized position for one player marker.
	 * @param {number} playerId Player identifier.
	 * @param {number} index Position within the active player array.
	 * @returns {DungeonMeeplePosition} Current preview or stored position.
	 */
	$: getMeeplePosition = (playerId: number, index: number): DungeonMeeplePosition => {
		return (
			getDungeonMeeplePosition($emblemState, selectedDungeonId, playerId) ??
			getDefaultMeeplePosition(index, activePlayers.length)
		);
	};

	const hasStoredMeeplePosition = (playerId: number) => {
		return playerId in selectedDungeonMeeples;
	};

	/**
	 * Converts a client-space coordinate to a normalized position inside the dungeon board.
	 * @param {number} clientX Horizontal pointer coordinate.
	 * @param {number} clientY Vertical pointer coordinate.
	 * @returns {DungeonMeeplePosition | null} Clamped normalized position or `null`.
	 */
	const getNormalizedBoardPosition = (clientX: number, clientY: number) => {
		if (!dungeonBoardEl) return null;
		const rect = dungeonBoardEl.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;

		return {
			x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
			y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
		};
	};

	/**
	 * Starts tracking a meeple drag at a given client position.
	 * @param {number} playerId Player identifier.
	 * @returns {void}
	 */
	const beginMeepleDrag = (playerId: number, clientX: number, clientY: number) => {
		const playerIndex = activePlayers.findIndex((player) => player.id === playerId);
		if (playerIndex < 0) return;

		const startPosition = getMeeplePosition(playerId, playerIndex);
		activeDungeonDragPlayerId = playerId;
		activeDungeonDragPosition = startPosition;
		activeDungeonDragStartPosition = startPosition;

		if (dungeonBoardEl) {
			const rect = dungeonBoardEl.getBoundingClientRect();
			activeDungeonDragOffsetPx = {
				x: startPosition.x * rect.width - (clientX - rect.left),
				y: startPosition.y * rect.height - (clientY - rect.top)
			};
		} else {
			activeDungeonDragOffsetPx = null;
		}
	};

	/**
	 * Resets all visible players' meeples to their default positions for this dungeon.
	 * @returns {void}
	 */
	const resetMeeplesToDefault = () => {
		if (!selectedDungeonId) return;
		activePlayers.forEach((player, index) => {
			setDungeonMeeplePosition(
				selectedDungeonId,
				player.id,
				getDefaultMeeplePosition(index, activePlayers.length)
			);
		});
		activeDungeonDragPlayerId = null;
		activeDungeonDragPosition = null;
		activeDungeonDragStartPosition = null;
		activeDungeonDragOffsetPx = null;
		vibrate(20);
	};

	/**
	 * Applies the captured pointer-to-marker offset to keep movement faithful.
	 * @param {number} clientX Pointer X coordinate.
	 * @param {number} clientY Pointer Y coordinate.
	 * @returns {{ x: number; y: number }} Adjusted client-space point.
	 */
	const applyDragOffset = (clientX: number, clientY: number) => {
		if (!dungeonBoardEl || !activeDungeonDragOffsetPx) {
			return { x: clientX, y: clientY };
		}

		return {
			x: clientX + activeDungeonDragOffsetPx.x,
			y: clientY + activeDungeonDragOffsetPx.y
		};
	};

	/**
	 * Updates the in-flight meeple preview while dragging.
	 * @param {number} playerId Player identifier.
	 * @param {number} clientX Pointer X coordinate.
	 * @param {number} clientY Pointer Y coordinate.
	 * @returns {void}
	 */
	const updateMeepleDrag = (playerId: number, clientX: number, clientY: number) => {
		if (activeDungeonDragPlayerId !== playerId) return;
		const adjusted = applyDragOffset(clientX, clientY);
		const normalized = getNormalizedBoardPosition(adjusted.x, adjusted.y);
		if (!normalized) return;
		activeDungeonDragPosition = normalized;
	};

	/**
	 * Finalizes a meeple drag, persists the new position and plays feedback.
	 * @param {number} playerId Player identifier.
	 * @param {number} clientX Pointer X coordinate.
	 * @param {number} clientY Pointer Y coordinate.
	 * @returns {void}
	 */
	const finishMeepleDrag = (playerId: number, clientX: number, clientY: number) => {
		if (activeDungeonDragPlayerId !== playerId || !selectedDungeonId) return;

		const adjusted = applyDragOffset(clientX, clientY);
		const normalized = getNormalizedBoardPosition(adjusted.x, adjusted.y);
		if (!normalized) {
			activeDungeonDragPlayerId = null;
			activeDungeonDragPosition = null;
			activeDungeonDragStartPosition = null;
			activeDungeonDragOffsetPx = null;
			return;
		}

		const previous = activeDungeonDragStartPosition;
		const positionChanged =
			!previous ||
			Math.abs(previous.x - normalized.x) > 0.002 ||
			Math.abs(previous.y - normalized.y) > 0.002;

		// Persist final drop first so rendered position immediately reflects store state.
		setDungeonMeeplePosition(selectedDungeonId, playerId, normalized);
		forceDungeonMeeplesRedraw(selectedDungeonId);

		activeDungeonDragPlayerId = null;
		activeDungeonDragPosition = null;
		activeDungeonDragStartPosition = null;
		activeDungeonDragOffsetPx = null;

		if (positionChanged) {
			vibrate(20);
			playGameplaySound('dungeonMove');
		}
	};

	const handleMeepleTouchStart = (
		playerId: number,
		event: CustomEvent<{ x: number; y: number }>
	) => {
		if (!event.detail || typeof event.detail.x !== 'number' || typeof event.detail.y !== 'number')
			return;
		beginMeepleDrag(playerId, event.detail.x, event.detail.y);
	};

	const handleMeepleTouchMove = (
		playerId: number,
		event: CustomEvent<{ x: number; y: number }>
	) => {
		if (!event.detail || typeof event.detail.x !== 'number' || typeof event.detail.y !== 'number')
			return;
		updateMeepleDrag(playerId, event.detail.x, event.detail.y);
	};

	const handleMeepleTouchEnd = (playerId: number, event: CustomEvent<{ x: number; y: number }>) => {
		if (!event.detail || typeof event.detail.x !== 'number' || typeof event.detail.y !== 'number')
			return;
		finishMeepleDrag(playerId, event.detail.x, event.detail.y);
	};

	const buildMeepleTouchStartHandler = (playerId: number) => (event: Event) => {
		handleMeepleTouchStart(playerId, event as CustomEvent<{ x: number; y: number }>);
	};

	const buildMeepleTouchMoveHandler = (playerId: number) => (event: Event) => {
		handleMeepleTouchMove(playerId, event as CustomEvent<{ x: number; y: number }>);
	};

	const buildMeepleTouchEndHandler = (playerId: number) => (event: Event) => {
		handleMeepleTouchEnd(playerId, event as CustomEvent<{ x: number; y: number }>);
	};

	const getMarkerColor = (playerColor: string, index: number) => {
		const paletteColor = LIFE_HISTORY_CHART_COLORS[index % LIFE_HISTORY_CHART_COLORS.length];
		const clean = (playerColor || '').trim();
		if (!clean || clean.includes(',')) return paletteColor;
		return paletteColor;
	};

	const swallowClick = () => undefined;

	/**
	 * Advances to next emblem face when available, otherwise closes the modal.
	 * @returns {unknown} Result produced by handleAdvanceOrClose.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	const handleAdvanceFace = () => {
		if (!selected || faces.length <= 1) return;
		currentFaceIndex = (currentFaceIndex + 1) % faces.length;
	};
</script>

<div class="bg-black/80 absolute w-full h-full top-0 left-0 flex justify-center items-center z-50">
	<div
		class="relative bg-[#2d2f30] rounded-[1.75rem] w-[94vw] max-h-[94vh] min-h-[84vh] p-4 sm:p-5 flex flex-col items-center"
		role="dialog"
	>
		{#if !!selectedDungeonId}
			<button
				type="button"
				class="absolute left-3 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-slate-600/95 text-2xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-slate-500 sm:left-4 sm:top-4 sm:h-14 sm:w-14"
				on:click={resetMeeplesToDefault}
				aria-label={$_('emblem_dungeon_reset')}
				title={$_('emblem_dungeon_reset')}
			>
				🔝
			</button>
		{/if}

		<button
			type="button"
			class="absolute right-3 top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-red-600/95 text-4xl font-black text-white shadow-xl transition-transform hover:scale-105 hover:bg-red-500 sm:right-4 sm:top-4 sm:h-16 sm:w-16 sm:text-5xl"
			on:click={closeSelectedEmblem}
			aria-label={$_('emblem_tap_close')}
			title={$_('emblem_tap_close')}
		>
			❌
		</button>

		{#if selected && currentFace}
			<div class="w-full px-1 pt-2 pb-2 text-center text-white">
				<div class="text-xl md:text-2xl font-bold truncate">{selected.name}</div>
				{#if selected.set_name}
					<div class="text-xs text-gray-300">{selected.set_name}</div>
				{/if}
				<div class="text-xs text-gray-400 mt-1">
					{$_('emblem_face_of')}
					{currentFaceIndex + 1}/{faces.length}
				</div>
			</div>

			{#if currentFace.image}
				<div class="w-full flex flex-col items-stretch gap-2">
					<div
						bind:this={dungeonBoardEl}
						class="relative w-full flex justify-center items-center overflow-hidden flex-1"
						on:click={handleAdvanceFace}
					>
						<img
							src={currentFace.image}
							alt={currentFace.name}
							class="max-h-[60vh] w-auto max-w-full object-contain rounded-xl"
							draggable="false"
						/>

						{#if selectedDungeonId && activePlayers.length > 0}
							<div class="pointer-events-none absolute inset-0 rounded-xl">
								{#each activePlayers as player, index (player.id)}
									{@const markerPosition = getMeeplePosition(player.id, index)}
									{@const isUnplacedMeeple = !hasStoredMeeplePosition(player.id)}
									<div
										class="pointer-events-auto absolute"
										style={`left: ${markerPosition.x * 100}%; top: ${markerPosition.y * 100}%; transform: translate(-50%, -50%);`}
									>
										<button
											type="button"
											draggable="false"
											class="meeple-marker"
											class:meeple-marker--new={isUnplacedMeeple}
											use:touchDragMeeple={{
												handle: '.meeple-handle',
												longPressMs: 240,
												ghost: true,
												ghostOpacity: 0.9,
												ghostScale: 1.08
											}}
											on:click|stopPropagation={swallowClick}
											on:dragstart={buildMeepleTouchStartHandler(player.id)}
											on:dragover={buildMeepleTouchMoveHandler(player.id)}
											on:dragend={buildMeepleTouchEndHandler(player.id)}
											aria-label={player.playerName}
											title={player.playerName}
										>
											<svg
												viewBox="0 0 80 80"
												class="meeple-handle h-14 w-14 overflow-visible sm:h-16 sm:w-16"
												aria-hidden="true"
											>
												<g transform="translate(40 40)">
													{#if index % 8 === 0}
														<circle
															r="28"
															fill={getMarkerColor(player.color, index)}
															stroke={markerStroke}
															stroke-width="3.2"
														/>
													{:else if index % 8 === 1}
														<rect
															x="-28"
															y="-28"
															width="56"
															height="56"
															fill={getMarkerColor(player.color, index)}
															stroke={markerStroke}
															stroke-width="3.2"
															rx="8"
														/>
													{:else}
														<polygon
															points={markerPolygonPoints(index, 28)}
															fill={getMarkerColor(player.color, index)}
															stroke={markerStroke}
															stroke-width="3.2"
														/>
													{/if}
													<text x="0" y="11" text-anchor="middle" class="meeple-number"
														>{index + 1}</text
													>
												</g>
											</svg>
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					{#if selectedDungeonId && activePlayers.length > 0}
						<div
							class="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-center text-[11px] leading-snug text-gray-200"
						>
							{$_('emblem_dungeon_drag_hint')}
						</div>

						<div
							class="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[11px] text-gray-200"
						>
							<div class="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
								{$_('emblem_dungeon_legend')}
							</div>
							<div class="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
								{#each activePlayers as player, index (player.id)}
									<div class="flex items-center gap-1.5">
										<svg viewBox="0 0 28 28" class="h-5 w-5 flex-shrink-0 overflow-visible" aria-hidden="true">
											<g transform="translate(14 14)">
												{#if index % 8 === 0}
													<circle r="11" fill={getMarkerColor(player.color, index)} stroke={markerStroke} stroke-width="1.6" />
												{:else if index % 8 === 1}
													<rect x="-11" y="-11" width="22" height="22" fill={getMarkerColor(player.color, index)} stroke={markerStroke} stroke-width="1.6" rx="3" />
												{:else}
													<polygon points={markerPolygonPoints(index, 11)} fill={getMarkerColor(player.color, index)} stroke={markerStroke} stroke-width="1.6" />
												{/if}
												<text x="0" y="4" text-anchor="middle" class="legend-marker-number">{index + 1}</text>
											</g>
										</svg>
										<span class="truncate max-w-[6rem] text-gray-100">{player.playerName}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-gray-300 text-sm py-12">{$_('emblem_no_image')}</div>
			{/if}

			<button
				type="button"
				class="mt-3 w-full text-gray-300 text-sm py-2 text-center rounded-xl transition-colors hover:bg-white/5"
				on:click={closeSelectedEmblem}
			>
				{$_('emblem_tap_close')}
			</button>
		{/if}
	</div>
</div>

<style>
	.meeple-marker {
		cursor: grab;
		touch-action: none;
		user-select: none;
		opacity: 0.68;
		filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.55));
		transition:
			transform 140ms ease,
			opacity 120ms ease,
			filter 140ms ease;
	}

	.meeple-marker:active {
		cursor: grabbing;
		transform: scale(1.08);
	}

	.meeple-marker:hover {
		filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.6));
	}

	.meeple-marker--new {
		outline: 2px dashed rgba(255, 255, 255, 0.78);
		outline-offset: 4px;
		animation: meepleNewPulse 1.8s ease-in-out infinite;
	}

	.meeple-number {
		fill: white;
		font-size: 20px;
		font-weight: 800;
		paint-order: stroke fill;
		stroke: rgba(0, 0, 0, 0.55);
		stroke-width: 1.2px;
		letter-spacing: 0.02em;
	}

	.legend-marker-number {
		fill: white;
		font-size: 10px;
		font-weight: 800;
		paint-order: stroke fill;
		stroke: rgba(0, 0, 0, 0.55);
		stroke-width: 0.6px;
	}

	@keyframes meepleNewPulse {
		0%,
		100% {
			transform: scale(1);
			filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.55));
		}
		50% {
			transform: scale(1.05);
			filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.72));
		}
	}
</style>
