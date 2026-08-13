// Planechase store – manages the planar deck, the active plane/phenomenon card,
// the chaos die roll result, and the 180° rotation toggle for opposite-side viewing.
import { persist } from './persist';
import type { ScryfallEmblemCard } from '$lib/utils/scryfall';
import {
	getSavedDeckSelections,
	normalizeSetCodes,
	removeSavedDeckSelection,
	type SavedDeckSelection,
	upsertSavedDeckSelection
} from './deckSelections';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanarDieResult = 'blank' | 'planeswalk' | 'chaos';

type PlanechaseState = {
	/** Shuffled planar deck (array of card objects). */
	deck: ScryfallEmblemCard[];
	/** Index of the top card currently in play (0-based). */
	currentIndex: number;
	/** Whether the Planechase modal is open. */
	isOpen: boolean;
	/** Last planar die result; `null` before any roll. */
	lastDieResult: PlanarDieResult | null;
	/** Whether the view is rotated 180° for opposite-side players. */
	rotated: boolean;
	/** Selected official set codes for deck customization. */
	selectedSetCodes: string[];
	/** Saved official-set selections for quick reuse. */
	savedSelections: SavedDeckSelection[];
};

const initialState: PlanechaseState = {
	deck: [],
	currentIndex: 0,
	isOpen: false,
	lastDieResult: null,
	rotated: false,
	selectedSetCodes: [],
	savedSelections: []
};

// We persist the deck so players can close and reopen the modal without losing their place.
// isOpen is always reset to false on load so a crashed/closed app doesn't auto-reopen the modal.
export const planechaseState = persist<PlanechaseState>('planechaseState', initialState);

// Reset the modal-open flag on every page load so an unexpected reload doesn't reopen it.
planechaseState.update((s) => ({ ...s, isOpen: false }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fisher-Yates shuffle (in-place, returns same array).
 */
function shuffleArray<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * Simulates a planar die roll with canonical distribution:
 * faces 1-4 → blank, face 5 → planeswalk, face 6 → chaos.
 */
const rollPlanar = (): PlanarDieResult => {
	const roll = Math.floor(Math.random() * 6) + 1;
	if (roll <= 4) return 'blank';
	if (roll === 5) return 'planeswalk';
	return 'chaos';
};

/**
 * Extracts the most relevant "chaos ensues" effect from an Oracle text block.
 * Returns the suffix starting at "Whenever chaos ensues" when available.
 */
export const extractChaosOracleText = (oracleText: string): string => {
	const text = (oracleText ?? '').trim();
	if (!text) return '';
	const matchIndex = text.toLowerCase().indexOf('whenever chaos ensues');
	if (matchIndex < 0) return text;
	return text.slice(matchIndex).trim();
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Loads the given cards as a new shuffled planar deck, resets the index, and opens the modal.
 */
export const loadPlanarDeck = (cards: ScryfallEmblemCard[]) => {
	const deck = shuffleArray([...cards]);
	planechaseState.update((s) => ({
		...s,
		deck,
		currentIndex: 0,
		lastDieResult: null
	}));
};

/** Opens the Planechase modal. */
export const openPlanechaseModal = () => {
	planechaseState.update((s) => ({ ...s, isOpen: true }));
};

/** Closes the Planechase modal. */
export const closePlanechaseModal = () => {
	planechaseState.update((s) => ({ ...s, isOpen: false, lastDieResult: null }));
};

/**
 * Rolls the planar die and advances the deck when the result is "planeswalk".
 * Returns the die result so callers can react immediately.
 */
export const rollPlanarDie = (): PlanarDieResult => {
	const result = rollPlanar();
	planechaseState.update((s) => {
		let nextIndex = s.currentIndex;
		if (result === 'planeswalk') {
			nextIndex = s.deck.length > 1 ? (s.currentIndex + 1) % s.deck.length : s.currentIndex;
		}
		return { ...s, lastDieResult: result, currentIndex: nextIndex };
	});
	return result;
};

/** Manually advance to the next card in the deck. */
export const nextPlane = () => {
	planechaseState.update((s) => {
		if (s.deck.length === 0) return s;
		return { ...s, currentIndex: (s.currentIndex + 1) % s.deck.length, lastDieResult: null };
	});
};

/** Manually go back to the previous card in the deck. */
export const prevPlane = () => {
	planechaseState.update((s) => {
		if (s.deck.length === 0) return s;
		return {
			...s,
			currentIndex: (s.currentIndex - 1 + s.deck.length) % s.deck.length,
			lastDieResult: null
		};
	});
};

/** Reshuffle the current deck and reset to the first card. */
export const reshuffleDeck = () => {
	planechaseState.update((s) => {
		const deck = shuffleArray([...s.deck]);
		return { ...s, deck, currentIndex: 0, lastDieResult: null };
	});
};

/** Toggle the 180° rotation for opposite-side players. */
export const togglePlanechaseRotation = () => {
	planechaseState.update((s) => ({ ...s, rotated: !s.rotated }));
};

/** Dismiss the last die result notification without advancing. */
export const dismissDieResult = () => {
	planechaseState.update((s) => ({ ...s, lastDieResult: null }));
};

/** Persist the current official-set checkbox selection used by the menu deck builder. */
export const setSelectedPlanarSetCodes = (setCodes: string[]) => {
	planechaseState.update((s) => ({
		...s,
		selectedSetCodes: normalizeSetCodes(setCodes),
		savedSelections: getSavedDeckSelections(s.savedSelections)
	}));
};

/** Save the current official-set selection under a reusable local name. */
export const savePlanarSelection = (name: string, setCodes: string[]) => {
	planechaseState.update((s) => ({
		...s,
		savedSelections: upsertSavedDeckSelection(s.savedSelections, name, setCodes)
	}));
};

/** Delete one saved official-set selection without altering the active planar deck. */
export const deletePlanarSelection = (name: string) => {
	planechaseState.update((s) => ({
		...s,
		savedSelections: removeSavedDeckSelection(s.savedSelections, name)
	}));
};
