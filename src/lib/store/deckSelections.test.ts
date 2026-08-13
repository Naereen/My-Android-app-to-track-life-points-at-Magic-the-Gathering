import { describe, expect, it } from 'vitest';
import {
	getSavedDeckSelections,
	normalizeSetCodes,
	removeSavedDeckSelection,
	upsertSavedDeckSelection
} from './deckSelections';

describe('deck selection helpers', () => {
	it('normalizes and deduplicates set codes', () => {
		expect(normalizeSetCodes([' moc ', 'WHO', 'moc', '', ' who '])).toEqual(['MOC', 'WHO']);
	});

	it('sanitizes missing or invalid saved selections', () => {
		expect(getSavedDeckSelections(undefined)).toEqual([]);
		expect(
			getSavedDeckSelections([
				{ name: '  My Deck  ', setCodes: ['moc', 'WHO'] },
				{ name: '', setCodes: ['opca'] },
				{ name: 'Broken', setCodes: [] }
			])
		).toEqual([{ name: 'My Deck', setCodes: ['MOC', 'WHO'] }]);
	});

	it('upserts the latest saved selection by name', () => {
		expect(
			upsertSavedDeckSelection([{ name: 'Favorites', setCodes: ['WHO'] }], 'Favorites', [
				'moc',
				'opca'
			])
		).toEqual([{ name: 'Favorites', setCodes: ['MOC', 'OPCA'] }]);
	});

	it('removes saved selections by trimmed name', () => {
		expect(
			removeSavedDeckSelection(
				[
					{ name: 'Deck A', setCodes: ['MOC'] },
					{ name: 'Deck B', setCodes: ['WHO'] }
				],
				' Deck A '
			)
		).toEqual([{ name: 'Deck B', setCodes: ['WHO'] }]);
	});
});
