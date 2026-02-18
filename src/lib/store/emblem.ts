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

export const setSelectedEmblem = (emblem: ScryfallEmblemCard | null) => {
	emblemState.update((data) => ({ ...data, selected: emblem }));
};

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

export const closeSelectedEmblem = () => {
	emblemModalOpen.set(false);
};

export const clearSelectedEmblem = () => {
	emblemState.update((data) => ({
		...data,
		selected: null,
		recent: []
	}));
	emblemModalOpen.set(false);
};
