import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
	MAX_FLIP_UNTIL_LOSE_ROUNDS,
	createCoinFlipStore,
	formatFlipGroups,
	formatFlipHistory,
	getCoinFlipStatistics,
	getTotalCoinsPerFlip
} from './coinFlipStore';

const createDeterministicStore = (sequence: number[]) => {
	let index = 0;
	return createCoinFlipStore(() => sequence[index++] ?? 0);
};

describe('coinFlipStore', () => {
	let store = createDeterministicStore([0.1]);

	beforeEach(() => {
		store = createDeterministicStore([0.1]);
	});

	it('flips the configured number of Krark’s Thumb groups and tracks totals', () => {
		store = createDeterministicStore([0.1, 0.8, 0.75, 0.2]);
		store.setKrarkThumbs(1);
		store.setCoinsToFlip(2);

		store.flipCoins();

		const state = get(store);
		expect(getTotalCoinsPerFlip(state)).toBe(4);
		expect(state.totalHeads).toBe(2);
		expect(state.totalTails).toBe(2);
		expect(state.lastResults.map((group) => group.results)).toEqual([
			['H', 'T'],
			['T', 'H']
		]);
		expect(formatFlipGroups(state.lastResults)).toBe('( HT, TH )');
		expect(formatFlipHistory(state.flipHistory, { head: 'H', tail: 'T' })).toBe('( 2H & 2T )');
	});

	it('formats flip summaries with localized coin result initials', () => {
		store = createDeterministicStore([0.1, 0.8, 0.75, 0.2]);

		store.setKrarkThumbs(1);
		store.setCoinsToFlip(2);
		store.flipCoins();

		const state = get(store);
		const formatCoinSide = (result: 'H' | 'T') => (result === 'H' ? 'F' : 'P');

		expect(formatFlipGroups(state.lastResults, formatCoinSide)).toBe('( FP, PF )');
		expect(formatFlipHistory(state.flipHistory, { head: 'F', tail: 'P' })).toBe('( 2F & 2P )');
	});

	it('keeps flipping until the called side disappears from a round', () => {
		store = createDeterministicStore([0.1, 0.2, 0.9]);

		store.flipUntilLose('H');

		const state = get(store);
		expect(state.lastResults.map((group) => group.results)).toEqual([['H'], ['H'], ['T']]);
		expect(state.totalHeads).toBe(2);
		expect(state.totalTails).toBe(1);
		expect(state.lastRunWasCapped).toBe(false);
		expect(getCoinFlipStatistics(state)).toEqual({
			longestHeadsStreak: 2,
			longestTailsStreak: 1
		});
	});

	it('resets tracked statistics without changing configuration', () => {
		store = createDeterministicStore([0.1, 0.8, 0.2, 0.9]);
		store.setKrarkThumbs(2);
		store.setCoinsToFlip(3);
		store.flipCoins();

		store.resetStats();

		const state = get(store);
		expect(state.krarkThumbs).toBe(2);
		expect(state.coinsToFlip).toBe(3);
		expect(state.totalHeads).toBe(0);
		expect(state.totalTails).toBe(0);
		expect(state.lastResults).toEqual([]);
		expect(state.flipHistory).toEqual([]);
	});

	it('caps flip-until-you-lose runs to keep the UI responsive', () => {
		store = createDeterministicStore(
			Array.from({ length: MAX_FLIP_UNTIL_LOSE_ROUNDS + 4 }, () => 0.1)
		);

		store.flipUntilLose('H');

		const state = get(store);
		expect(state.lastRunWasCapped).toBe(true);
		expect(state.lastResults).toHaveLength(MAX_FLIP_UNTIL_LOSE_ROUNDS);
	});
});
