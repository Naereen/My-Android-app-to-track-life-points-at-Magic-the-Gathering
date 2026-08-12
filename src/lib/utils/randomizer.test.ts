import { describe, expect, it } from 'vitest';
import { getRandomizerResultTranslationKey } from './randomizer';

describe('getRandomizerResultTranslationKey', () => {
	it('maps d2 results to localized coin-flip labels', () => {
		expect(getRandomizerResultTranslationKey('d2', 1)).toBe('coin_result_head');
		expect(getRandomizerResultTranslationKey('d2', 2)).toBe('coin_result_tail');
	});

	it('returns null for unsupported dice types or missing results', () => {
		expect(getRandomizerResultTranslationKey('d6', 1)).toBeNull();
		expect(getRandomizerResultTranslationKey('d2', 0)).toBeNull();
		expect(getRandomizerResultTranslationKey('', 2)).toBeNull();
	});
});
