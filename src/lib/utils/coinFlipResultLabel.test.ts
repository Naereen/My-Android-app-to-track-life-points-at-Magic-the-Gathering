import { describe, expect, it } from 'vitest';

import { getCoinResultShortLabel } from './coinFlipResultLabel';

describe('getCoinResultShortLabel', () => {
	it('prefers explicit localized short labels when provided', () => {
		expect(getCoinResultShortLabel('F', 'Face', 'Head')).toBe('F');
		expect(getCoinResultShortLabel('P', 'Pile', 'Tail')).toBe('P');
		expect(getCoinResultShortLabel('Ca', 'Cara', 'Head')).toBe('Ca');
		expect(getCoinResultShortLabel('Co', 'Coroa', 'Tail')).toBe('Co');
	});

	it('falls back to the first translated character when no short label is provided', () => {
		expect(getCoinResultShortLabel('', '正面', 'Head')).toBe('正');
		expect(getCoinResultShortLabel(undefined, 'Орёл', 'Head')).toBe('О');
		expect(getCoinResultShortLabel('   ', 'Pile', 'Tail')).toBe('P');
		expect(getCoinResultShortLabel('', '', 'Tail')).toBe('T');
	});
});
