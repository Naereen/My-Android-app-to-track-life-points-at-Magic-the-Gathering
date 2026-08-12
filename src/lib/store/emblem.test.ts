import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import type { ScryfallEmblemCard } from '$lib/utils/scryfall';
import {
	clearDungeonMeeplePosition,
	clearSelectedEmblem,
	emblemModalOpen,
	emblemState,
	getDungeonMeeplePosition,
	openSelectedEmblem,
	setDungeonMeeplePosition
} from './emblem';

const makeEmblem = (id: string, name = `Emblem ${id}`): ScryfallEmblemCard => ({
	id,
	name,
	faces: [{ name, image: 'https://example.test/emblem.jpg' }]
});

describe('emblem store helpers', () => {
	beforeEach(() => {
		clearSelectedEmblem();
		emblemState.set({
			selected: null,
			recent: [],
			dungeonMeeples: {}
		});
	});

	it('stores normalized dungeon meeple positions and reuses previous coordinates as invalid fallbacks', () => {
		setDungeonMeeplePosition('dungeon-a', 1, { x: 0.25, y: 0.75 });
		setDungeonMeeplePosition('dungeon-a', 1, { x: Number.POSITIVE_INFINITY, y: -1 });

		expect(getDungeonMeeplePosition(get(emblemState), 'dungeon-a', 1)).toEqual({
			x: 0.25,
			y: 0
		});
	});

	it('returns null for missing dungeon coordinates and removes empty dungeon entries', () => {
		expect(getDungeonMeeplePosition(get(emblemState), null, 1)).toBeNull();

		setDungeonMeeplePosition('dungeon-a', 1, { x: 0.4, y: 0.6 });
		clearDungeonMeeplePosition('dungeon-a', 1);

		expect(getDungeonMeeplePosition(get(emblemState), 'dungeon-a', 1)).toBeNull();
		expect(get(emblemState).dungeonMeeples).toEqual({});
	});

	it('opens the selected emblem modal and keeps a deduplicated recent history capped at five cards', () => {
		const emblems = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => makeEmblem(id));

		for (const emblem of emblems) {
			openSelectedEmblem(emblem);
		}
		openSelectedEmblem(emblems[2]);

		expect(get(emblemModalOpen)).toBe(true);
		expect(get(emblemState).recent.map((emblem) => emblem.id)).toEqual(['c', 'f', 'e', 'd', 'b']);
	});
});
