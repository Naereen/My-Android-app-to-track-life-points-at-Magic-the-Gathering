// Emblem store for managing selected emblems and dungeon meeple positions.
// This store is persisted to local storage so that emblem selection and meeple positions are remembered across sessions.
//
import { writable } from 'svelte/store';
import { persist } from './persist';
import type { ScryfallEmblemCard } from '$lib/utils/scryfall';

export type DungeonMeeplePosition = {
	x: number;
	y: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const sanitizeCoord = (value: number, fallback: number) => {
	if (!Number.isFinite(value)) return clamp01(fallback);
	return clamp01(value);
};

type DungeonMeeplePositionsByDungeon = Record<string, Record<number, DungeonMeeplePosition>>;

type EmblemState = {
	selected: ScryfallEmblemCard | null;
	recent: ScryfallEmblemCard[];
	dungeonMeeples: DungeonMeeplePositionsByDungeon;
};

const initialEmblemState: EmblemState = {
	selected: null,
	recent: [],
	dungeonMeeples: {}
};

const numberOfPreviousEmblemsToStore = 5;

export const emblemState = persist<EmblemState>('emblemState', initialEmblemState);
export const emblemModalOpen = writable(false);

/**
 * Sets the currently focused emblem/dungeon card.
 * @param {ScryfallEmblemCard | null} emblem Card to preview, or `null` to clear selection.
 * @returns {void}
 */
export const setSelectedEmblem = (emblem: ScryfallEmblemCard | null) => {
	emblemState.update((data) => ({ ...data, selected: emblem }));
};

/**
 * Returns the stored meeple position for one player in one dungeon, if it exists.
 * Caller must pass a reactive state snapshot (for example `$emblemState` in Svelte)
 * so reads stay fully traceable by Svelte reactivity.
 * @param {Pick<EmblemState, 'dungeonMeeples'>} state Emblem state snapshot.
 * @param {string | null | undefined} dungeonId Dungeon card identifier.
 * @param {number} playerId Player identifier.
 * @returns {DungeonMeeplePosition | null} Stored normalized position or `null`.
 */
export const getDungeonMeeplePosition = (
	state: Pick<EmblemState, 'dungeonMeeples'>,
	dungeonId: string | null | undefined,
	playerId: number
) => {
	if (!dungeonId) return null;
	const positions = state.dungeonMeeples?.[dungeonId];
	return positions?.[playerId] ?? null;
};

/**
 * Forces Svelte subscribers to re-render meeple positions.
 * Usually unnecessary because `setDungeonMeeplePosition` already creates new
 * object references and triggers reactivity. Keep this helper for explicit UI refreshes.
 * @param {string} [dungeonId] Optional dungeon id to limit redraw scope.
 * @returns {void}
 */
export const forceDungeonMeeplesRedraw = (dungeonId?: string) => {
	emblemState.update((data) => {
		if (!dungeonId) {
			return {
				...data,
				dungeonMeeples: {
					...(data.dungeonMeeples ?? {})
				}
			};
		}

		const currentDungeon = data.dungeonMeeples?.[dungeonId];
		if (!currentDungeon) return data;

		return {
			...data,
			dungeonMeeples: {
				...(data.dungeonMeeples ?? {}),
				[dungeonId]: {
					...currentDungeon
				}
			}
		};
	});
};

/**
 * Persists one meeple position for one player in one dungeon.
 * Positions are stored as normalized coordinates in the `[0, 1]` range.
 * @param {string} dungeonId Dungeon card identifier.
 * @param {number} playerId Player identifier.
 * @param {DungeonMeeplePosition} position Normalized board position.
 * @returns {void}
 */
export const setDungeonMeeplePosition = (
	dungeonId: string,
	playerId: number,
	position: DungeonMeeplePosition
) => {
	if (!dungeonId) return;

	emblemState.update((data) => {
		const existingForDungeon = data.dungeonMeeples?.[dungeonId] ?? {};
		const previous = existingForDungeon[playerId];
		const nextX = sanitizeCoord(position.x, previous?.x ?? 0.5);
		const nextY = sanitizeCoord(position.y, previous?.y ?? 0.5);

		return {
			...data,
			dungeonMeeples: {
				...(data.dungeonMeeples ?? {}),
				[dungeonId]: {
					...existingForDungeon,
					[playerId]: {
						x: nextX,
						y: nextY
					}
				}
			}
		};
	});
};

/**
 * Removes one persisted meeple position for one player in one dungeon.
 * @param {string} dungeonId Dungeon card identifier.
 * @param {number} playerId Player identifier.
 * @returns {void}
 */
export const clearDungeonMeeplePosition = (dungeonId: string, playerId: number) => {
	if (!dungeonId) return;

	emblemState.update((data) => {
		const existingForDungeon = data.dungeonMeeples?.[dungeonId] ?? {};
		if (!(playerId in existingForDungeon)) return data;

		const nextForDungeon = { ...existingForDungeon };
		delete nextForDungeon[playerId];

		const nextDungeonMeeples = {
			...(data.dungeonMeeples ?? {})
		};

		if (Object.keys(nextForDungeon).length === 0) {
			delete nextDungeonMeeples[dungeonId];
		} else {
			nextDungeonMeeples[dungeonId] = nextForDungeon;
		}

		return {
			...data,
			dungeonMeeples: nextDungeonMeeples
		};
	});
};

/**
 * Inserts an emblem into the recents list while deduplicating by card id.
 * Keeps only the latest `numberOfPreviousEmblemsToStore` entries.
 * @param {ScryfallEmblemCard} emblem Emblem to remember in recents.
 * @returns {void}
 */
const pushRecentEmblem = (emblem: ScryfallEmblemCard) => {
	emblemState.update((data) => {
		const currentRecent = Array.isArray((data as any).recent) ? data.recent : [];
		const withoutCurrent = currentRecent.filter((item) => item.id !== emblem.id);
		const nextRecent = [emblem, ...withoutCurrent].slice(0, numberOfPreviousEmblemsToStore);
		return {
			...data,
			recent: nextRecent
		};
	});
};

/**
 * Opens the emblem modal for a given card (or the existing selected one).
 * Also updates the recents list when an emblem is actually displayed.
 * @param {ScryfallEmblemCard | null} [emblem] Optional card to set before opening.
 * @returns {void}
 */
export const openSelectedEmblem = (emblem?: ScryfallEmblemCard | null) => {
	if (emblem !== undefined) {
		setSelectedEmblem(emblem);
	}

	let selected: ScryfallEmblemCard | null = null;
	const unsubscribe = emblemState.subscribe((data) => {
		selected = data.selected;
	});
	unsubscribe();

	if (selected) {
		pushRecentEmblem(selected);
		emblemModalOpen.set(true);
	}
};

/**
 * Closes the emblem modal while preserving selected/recent state.
 * @returns {void}
 */
export const closeSelectedEmblem = () => {
	emblemModalOpen.set(false);
};

/**
 * Clears emblem selection and recents, then closes the modal.
 * @returns {void}
 */
export const clearSelectedEmblem = () => {
	emblemState.update((data) => ({
		...data,
		selected: null,
		recent: []
	}));
	emblemModalOpen.set(false);
};
