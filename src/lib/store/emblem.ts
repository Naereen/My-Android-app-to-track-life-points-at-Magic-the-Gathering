import { get, writable } from 'svelte/store';
import { persist } from './persist';
import type { ScryfallEmblemCard } from '$lib/utils/scryfall';

export type DungeonMeeplePosition = {
	x: number;
	y: number;
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
 * @param {string | null | undefined} dungeonId Dungeon card identifier.
 * @param {number} playerId Player identifier.
 * @returns {DungeonMeeplePosition | null} Stored normalized position or `null`.
 */
export const getDungeonMeeplePosition = (
	dungeonId: string | null | undefined,
	playerId: number
) => {
	if (!dungeonId) return null;
	const positions = get(emblemState).dungeonMeeples?.[dungeonId];
	return positions?.[playerId] ?? null;
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
	emblemState.update((data) => {
		const existingForDungeon = data.dungeonMeeples?.[dungeonId] ?? {};
		return {
			...data,
			dungeonMeeples: {
				...(data.dungeonMeeples ?? {}),
				[dungeonId]: {
					...existingForDungeon,
					[playerId]: {
						x: Math.min(1, Math.max(0, position.x)),
						y: Math.min(1, Math.max(0, position.y))
					}
				}
			}
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

	const selected = get(emblemState).selected;
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
