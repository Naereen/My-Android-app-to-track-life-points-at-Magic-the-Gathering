// Archenemy store – manages the scheme deck, the active scheme card, and ongoing scheme tracking.
import { persist } from './persist';
import type { ScryfallEmblemCard } from '$lib/utils/scryfall';
import {
	normalizeSetCodes,
	removeSavedDeckSelection,
	type SavedDeckSelection,
	upsertSavedDeckSelection
} from './deckSelections';
import { secureRandomInt } from '$lib/utils/cryptoRandom';

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
	/** List of currently active ongoing scheme cards (accumulated across turns). */
	activeOngoingSchemes: ScryfallEmblemCard[];
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
	activeOngoingSchemes: [],
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
		const j = secureRandomInt(0, i);
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
		ongoingAbandoned: false,
		activeOngoingSchemes: []
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
		// If current scheme is ongoing and not yet abandoned, keep it and accumulate.
		if (s.isOngoing && !s.ongoingAbandoned) {
			const currentCard = s.deck[s.currentIndex];
			const alreadyTracked = s.activeOngoingSchemes.some((c) => c.id === currentCard.id);
			const activeOngoingSchemes = alreadyTracked
				? s.activeOngoingSchemes
				: [...s.activeOngoingSchemes, currentCard];
			return { ...s, activeOngoingSchemes };
		}
		const nextIndex = s.deck.length > 1 ? (s.currentIndex + 1) % s.deck.length : s.currentIndex;
		const isOngoing = detectOngoing(s.deck[nextIndex]);
		// If the next card is also ongoing, start accumulating it
		const nextCard = s.deck[nextIndex];
		const activeOngoingSchemes =
			isOngoing && !s.activeOngoingSchemes.some((c) => c.id === nextCard.id)
				? [...s.activeOngoingSchemes, nextCard]
				: s.activeOngoingSchemes;
		return {
			...s,
			currentIndex: nextIndex,
			isOngoing,
			ongoingAbandoned: false,
			activeOngoingSchemes
		};
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
		return {
			...s,
			deck,
			currentIndex: 0,
			isOngoing,
			ongoingAbandoned: false,
			activeOngoingSchemes: []
		};
	});
};

/**
 * Abandons the current ongoing scheme, removing it from play and advancing the deck.
 * Only meaningful when `isOngoing` is true.
 */
export const abandonOngoingScheme = () => {
	archenemyState.update((s) => {
		if (!s.isOngoing || s.deck.length === 0) return s;
		const currentCard = s.deck[s.currentIndex];
		const activeOngoingSchemes = s.activeOngoingSchemes.filter((c) => c.id !== currentCard.id);
		if (s.deck.length === 1) {
			// Only card in deck — mark abandoned so the UI can reflect the state
			return { ...s, ongoingAbandoned: true, activeOngoingSchemes };
		}
		const nextIndex = (s.currentIndex + 1) % s.deck.length;
		const isOngoing = detectOngoing(s.deck[nextIndex]);
		return {
			...s,
			currentIndex: nextIndex,
			isOngoing,
			ongoingAbandoned: false,
			activeOngoingSchemes
		};
	});
};

/**
 * Abandons an ongoing scheme from the activeOngoingSchemes list by its index.
 * If the abandoned card is the currently displayed scheme, also marks it as abandoned.
 */
export const abandonOngoingSchemeByIndex = (index: number) => {
	archenemyState.update((s) => {
		const abandonedCard = s.activeOngoingSchemes[index];
		if (!abandonedCard) return s;
		const activeOngoingSchemes = s.activeOngoingSchemes.filter((_, i) => i !== index);
		const currentCard = s.deck[s.currentIndex];
		if (abandonedCard.id === currentCard?.id) {
			// The currently displayed card is being abandoned — advance the deck
			if (s.deck.length === 1) {
				return { ...s, ongoingAbandoned: true, activeOngoingSchemes };
			}
			const nextIndex = (s.currentIndex + 1) % s.deck.length;
			const isOngoing = detectOngoing(s.deck[nextIndex]);
			return {
				...s,
				currentIndex: nextIndex,
				isOngoing,
				ongoingAbandoned: false,
				activeOngoingSchemes
			};
		}
		return { ...s, activeOngoingSchemes };
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
