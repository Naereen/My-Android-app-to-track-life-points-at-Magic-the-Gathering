// Archenemy store – manages the scheme deck, the active scheme card, and ongoing scheme tracking.
import { persist } from './persist';
import type { ScryfallEmblemCard } from '$lib/utils/scryfall';
import {
	normalizeSetCodes,
	removeSavedDeckSelection,
	type SavedDeckSelection,
	upsertSavedDeckSelection
} from './deckSelections';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ArchenemyState = {
	/** Shuffled scheme deck (array of card objects). */
	deck: ScryfallEmblemCard[];
	/** Index of the top scheme currently in play (0-based). */
	currentIndex: number;
	/** Whether the Archenemy modal is open. */
	isOpen: boolean;
	/** Whether the current scheme is an "ongoing" scheme (stays in play). */
	isOngoing: boolean;
	/** Whether the current ongoing scheme has been abandoned. */
	ongoingAbandoned: boolean;
	/** Selected official set codes for deck customization. */
	selectedSetCodes: string[];
	/** Saved official-set selections for quick reuse. */
	savedSelections: SavedDeckSelection[];
};

const initialState: ArchenemyState = {
	deck: [],
	currentIndex: 0,
	isOpen: false,
	isOngoing: false,
	ongoingAbandoned: false,
	selectedSetCodes: [],
	savedSelections: []
};

// We persist the deck so players can close and reopen the modal without losing their place.
// isOpen is always reset to false on load so a crashed/closed app doesn't auto-reopen the modal.
export const archenemyState = persist<ArchenemyState>('archenemyState', initialState);

// Reset the modal-open flag on every page load.
archenemyState.update((s) => ({ ...s, isOpen: false }));

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
 * Returns true when the card's oracle text mentions "ongoing" (case-insensitive).
 * Ongoing schemes remain in play until abandoned; non-ongoing schemes are set aside after use.
 */
function detectOngoing(card: ScryfallEmblemCard): boolean {
	const text = card.faces?.[0]?.oracleText ?? '';
	return /\bongoing\b/i.test(text);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Loads the given cards as a new shuffled scheme deck, resets the index, and opens the modal.
 */
export const loadSchemeDeck = (cards: ScryfallEmblemCard[]) => {
	const deck = shuffleArray([...cards]);
	const isOngoing = deck.length > 0 ? detectOngoing(deck[0]) : false;
	archenemyState.update((s) => ({
		...s,
		deck,
		currentIndex: 0,
		isOngoing,
		ongoingAbandoned: false
	}));
};

/** Opens the Archenemy modal. */
export const openArchenemyModal = () => {
	archenemyState.update((s) => ({ ...s, isOpen: true }));
};

/** Closes the Archenemy modal. */
export const closeArchenemyModal = () => {
	archenemyState.update((s) => ({ ...s, isOpen: false }));
};

/**
 * Reveals the next scheme from the top of the deck (used at the start of each Archenemy turn).
 * If the current scheme is ongoing and not abandoned, this is a no-op (ongoing stays in play).
 */
export const revealNextScheme = () => {
	archenemyState.update((s) => {
		if (s.deck.length === 0) return s;
		// If current scheme is ongoing and not yet abandoned, keep it.
		if (s.isOngoing && !s.ongoingAbandoned) return s;
		const nextIndex = s.deck.length > 1 ? (s.currentIndex + 1) % s.deck.length : s.currentIndex;
		const isOngoing = detectOngoing(s.deck[nextIndex]);
		return { ...s, currentIndex: nextIndex, isOngoing, ongoingAbandoned: false };
	});
};

/** Manually advance to the next scheme in the deck. */
export const nextScheme = () => {
	archenemyState.update((s) => {
		if (s.deck.length === 0) return s;
		const nextIndex = (s.currentIndex + 1) % s.deck.length;
		const isOngoing = detectOngoing(s.deck[nextIndex]);
		return { ...s, currentIndex: nextIndex, isOngoing, ongoingAbandoned: false };
	});
};

/** Manually go back to the previous scheme in the deck. */
export const prevScheme = () => {
	archenemyState.update((s) => {
		if (s.deck.length === 0) return s;
		const prevIndex = (s.currentIndex - 1 + s.deck.length) % s.deck.length;
		const isOngoing = detectOngoing(s.deck[prevIndex]);
		return { ...s, currentIndex: prevIndex, isOngoing, ongoingAbandoned: false };
	});
};

/** Reshuffle the current deck and reset to the first card. */
export const reshuffleSchemeDeck = () => {
	archenemyState.update((s) => {
		const deck = shuffleArray([...s.deck]);
		const isOngoing = deck.length > 0 ? detectOngoing(deck[0]) : false;
		return { ...s, deck, currentIndex: 0, isOngoing, ongoingAbandoned: false };
	});
};

/**
 * Abandons the current ongoing scheme, removing it from play and advancing the deck.
 * Only meaningful when `isOngoing` is true.
 */
export const abandonOngoingScheme = () => {
	archenemyState.update((s) => {
		if (!s.isOngoing || s.deck.length === 0) return s;
		if (s.deck.length === 1) {
			// Only card in deck — mark abandoned so the UI can reflect the state
			return { ...s, ongoingAbandoned: true };
		}
		const nextIndex = (s.currentIndex + 1) % s.deck.length;
		const isOngoing = detectOngoing(s.deck[nextIndex]);
		return { ...s, currentIndex: nextIndex, isOngoing, ongoingAbandoned: false };
	});
};

/** Persist the current official-set checkbox selection used by the menu deck builder. */
export const setSelectedSchemeSetCodes = (setCodes: string[]) => {
	archenemyState.update((s) => ({
		...s,
		selectedSetCodes: normalizeSetCodes(setCodes)
	}));
};

/** Save the current official-set selection under a reusable local name. */
export const saveSchemeSelection = (name: string, setCodes: string[]) => {
	archenemyState.update((s) => ({
		...s,
		savedSelections: upsertSavedDeckSelection(s.savedSelections, name, setCodes)
	}));
};

/** Delete one saved official-set selection without altering the active scheme deck. */
export const deleteSchemeSelection = (name: string) => {
	archenemyState.update((s) => ({
		...s,
		savedSelections: removeSavedDeckSelection(s.savedSelections, name)
	}));
};
