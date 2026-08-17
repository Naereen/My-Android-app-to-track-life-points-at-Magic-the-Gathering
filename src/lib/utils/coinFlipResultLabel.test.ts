import { describe, expect, it } from 'vitest';

import { getCoinResultInitial } from './coinFlipResultLabel';

describe('getCoinResultInitial', () => {
	it('returns the first translated character for localized coin result labels', () => {
		expect(getCoinResultInitial('Face', 'Head')).toBe('F');
		expect(getCoinResultInitial('Pile', 'Tail')).toBe('P');
		expect(getCoinResultInitial('正面', 'Head')).toBe('正');
		expect(getCoinResultInitial('Орёл', 'Head')).toBe('О');
	});

	it('falls back to the default label when the translation is blank', () => {
		expect(getCoinResultInitial('', 'Head')).toBe('H');
		expect(getCoinResultInitial('   ', 'Tail')).toBe('T');
	});
});
