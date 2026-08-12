import { describe, expect, it } from 'vitest';
import { extractChaosOracleText } from './planechase';

describe('extractChaosOracleText', () => {
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
