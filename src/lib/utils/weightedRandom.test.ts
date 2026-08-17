import { afterEach, describe, expect, it, vi } from 'vitest';
import * as cryptoRandom from './cryptoRandom';
import { pickWeightedIndex } from './weightedRandom';

describe('pickWeightedIndex', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns zero when asked to pick from no active seats', () => {
		expect(pickWeightedIndex([1, 2, 3], 0)).toBe(0);
	});

	it('selects the bucket matching the random roll across weighted ranges', () => {
		vi.spyOn(cryptoRandom, 'secureRandomFloat')
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(0.2)
			.mockReturnValueOnce(0.95);

		expect(pickWeightedIndex([1, 2, 3], 3)).toBe(0);
		expect(pickWeightedIndex([1, 2, 3], 3)).toBe(1);
		expect(pickWeightedIndex([1, 2, 3], 3)).toBe(2);
	});

	it('flattens invalid weights to zero and falls back to an even pick when all are unusable', () => {
		vi.spyOn(cryptoRandom, 'secureRandomInt').mockReturnValue(2);

		expect(pickWeightedIndex([Number.NaN, -10, 0], 3)).toBe(2);
	});

	it('still reaches later seats when earlier weights are zero', () => {
		vi.spyOn(cryptoRandom, 'secureRandomFloat').mockReturnValue(0.1);

		expect(pickWeightedIndex([0, 0, 5], 3)).toBe(2);
	});
});
