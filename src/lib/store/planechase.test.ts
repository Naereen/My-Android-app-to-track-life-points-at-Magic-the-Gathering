import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
	deletePlanarSelection,
	extractChaosOracleText,
	planechaseState,
	savePlanarSelection,
	setSelectedPlanarSetCodes
} from './planechase';

const defaultState = structuredClone(get(planechaseState));

describe('extractChaosOracleText', () => {
	it('returns empty string for empty input', () => {
		expect(extractChaosOracleText('')).toBe('');
	});

	it('returns full text when no chaos clause is present', () => {
		const text = 'Players can’t cast spells.';
		expect(extractChaosOracleText(text)).toBe(text);
	});

	it('returns only the chaos clause when present', () => {
		const text =
			'When you planeswalk to this plane, draw a card.\nWhenever chaos ensues, each player sacrifices a permanent.';
		expect(extractChaosOracleText(text)).toBe(
			'Whenever chaos ensues, each player sacrifices a permanent.'
		);
	});
});

describe('planechase deck customization state', () => {
	beforeEach(() => {
		planechaseState.set(structuredClone(defaultState));
	});

	it('stores selected set codes and saved selections from legacy state shapes', () => {
		planechaseState.set({
			...structuredClone(defaultState),
			selectedSetCodes: undefined as unknown as string[],
			savedSelections: undefined as unknown as { name: string; setCodes: string[] }[]
		});

		setSelectedPlanarSetCodes([' moc ', 'who', 'MOC']);
		savePlanarSelection('  Travel Pack  ', ['opca', 'who']);

		expect(get(planechaseState).selectedSetCodes).toEqual(['MOC', 'WHO']);
		expect(get(planechaseState).savedSelections).toEqual([
			{ name: 'Travel Pack', setCodes: ['OPCA', 'WHO'] }
		]);

		deletePlanarSelection('Travel Pack');
		expect(get(planechaseState).savedSelections).toEqual([]);
	});
});
