import { get, writable } from 'svelte/store';
import { persist } from './persist';
import type { ScryfallEmblemCard } from '$lib/utils/scryfall';

type EmblemState = {
	selected: ScryfallEmblemCard | null;
	recent: ScryfallEmblemCard[];
};

const initialEmblemState: EmblemState = {
	selected: null,
	recent: []
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
