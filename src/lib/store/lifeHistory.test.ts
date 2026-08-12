import { describe, expect, it } from 'vitest';
import { resolveChartColor } from './lifeHistory';

describe('resolveChartColor', () => {
	it('keeps supported named colors and hex colors when they are chart-safe', () => {
		expect(resolveChartColor('mud', 0)).toBe('#704214');
		expect(resolveChartColor('#abc123', 1)).toBe('#abc123');
	});

	it('falls back to palette colors for gradients, low-contrast tokens, and unknown values', () => {
		expect(resolveChartColor('red,blue', 0)).toBe('#38bdf8');
		expect(resolveChartColor('white', 1)).toBe('#f472b6');
		expect(resolveChartColor('black', 2)).toBe('#f59e0b');
		expect(resolveChartColor('mystery-color', 3)).toBe('#34d399');
	});

	it('wraps around the fallback palette for higher player indexes', () => {
		expect(resolveChartColor(undefined, 8)).toBe('#38bdf8');
	});
});
