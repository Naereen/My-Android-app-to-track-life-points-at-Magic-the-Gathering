import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
	archenemyState,
	deleteSchemeSelection,
	saveSchemeSelection,
	setSelectedSchemeSetCodes
} from './archenemy';

const defaultState = structuredClone(get(archenemyState));

describe('archenemy deck customization state', () => {
	beforeEach(() => {
		archenemyState.set(structuredClone(defaultState));
	});

	it('stores selected scheme set codes and saved selections', () => {
		archenemyState.set({
			...structuredClone(defaultState),
			selectedSetCodes: undefined as unknown as string[],
			savedSelections: undefined as unknown as { name: string; setCodes: string[] }[]
		});

		setSelectedSchemeSetCodes([' oarc ', 'oe01', 'OARC']);
		saveSchemeSelection('  Bolas  ', ['oe01']);

		expect(get(archenemyState).selectedSetCodes).toEqual(['OARC', 'OE01']);
		expect(get(archenemyState).savedSelections).toEqual([{ name: 'Bolas', setCodes: ['OE01'] }]);

		deleteSchemeSelection('Bolas');
		expect(get(archenemyState).savedSelections).toEqual([]);
	});
});
