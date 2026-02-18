import { get, writable } from 'svelte/store';
import { persist } from './persist';
import type { ScryfallEmblemCard } from '$lib/utils/scryfall';

type EmblemState = {
	selected: ScryfallEmblemCard | null;
};

const initialEmblemState: EmblemState = {
	selected: null
};

export const emblemState = persist<EmblemState>('emblemState', initialEmblemState);
export const emblemModalOpen = writable(false);

export const setSelectedEmblem = (emblem: ScryfallEmblemCard | null) => {
	emblemState.update((data) => ({ ...data, selected: emblem }));
};

export const openSelectedEmblem = (emblem?: ScryfallEmblemCard | null) => {
	if (emblem !== undefined) {
		setSelectedEmblem(emblem);
	}

	if (get(emblemState).selected) {
		emblemModalOpen.set(true);
	}
};

export const closeSelectedEmblem = () => {
	emblemModalOpen.set(false);
};

export const clearSelectedEmblem = () => {
	setSelectedEmblem(null);
	emblemModalOpen.set(false);
};
