import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	flipCoin,
	rollDie,
	secureRandomFloat,
	secureRandomInt,
	secureShuffle
} from './cryptoRandom';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('cryptoRandom', () => {
	it('secureRandomInt always stays within [min, max]', () => {
		for (let i = 0; i < 500; i++) {
			const value = secureRandomInt(3, 9);
			expect(value).toBeGreaterThanOrEqual(3);
			expect(value).toBeLessThanOrEqual(9);
		}
	});

	it('handles edge bounds (min === max and negative ranges)', () => {
		expect(secureRandomInt(7, 7)).toBe(7);
		for (let i = 0; i < 200; i++) {
			const value = secureRandomInt(-5, -1);
			expect(value).toBeGreaterThanOrEqual(-5);
			expect(value).toBeLessThanOrEqual(-1);
		}
	});

	it('secureRandomFloat returns values in [0, 1[', () => {
		for (let i = 0; i < 500; i++) {
			const value = secureRandomFloat();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});

	it('secureShuffle keeps the same members', () => {
		const input = [1, 2, 3, 4, 5, 6];
		const shuffled = secureShuffle([...input]);
		expect(shuffled).toHaveLength(input.length);
		expect([...shuffled].sort((a, b) => a - b)).toEqual(input);
	});

	it('rollDie and flipCoin stay within expected ranges', () => {
		for (let i = 0; i < 200; i++) {
			const roll = rollDie(6);
			expect(roll).toBeGreaterThanOrEqual(1);
			expect(roll).toBeLessThanOrEqual(6);
			expect(typeof flipCoin()).toBe('boolean');
		}
	});

	it('validates invalid integer bounds', () => {
		expect(() => secureRandomInt(2, 1)).toThrow(/min <= max/i);
		expect(() => secureRandomInt(0.1, 1)).toThrow(/integer bounds/i);
		expect(() => secureRandomInt(0, 1.1)).toThrow(/integer bounds/i);
		expect(() => secureRandomInt(0, 0x100000000)).toThrow(/2\^32/i);
	});

	it('validates rollDie arguments', () => {
		expect(() => rollDie(0)).toThrow(/positive integer/i);
		expect(() => rollDie(-1)).toThrow(/positive integer/i);
		expect(() => rollDie(1.5)).toThrow(/positive integer/i);
	});

	it('throws when crypto.getRandomValues is unavailable', () => {
		vi.stubGlobal('crypto', undefined);
		expect(() => secureRandomInt(0, 1)).toThrow(/crypto\.getRandomValues/i);
	});
});
