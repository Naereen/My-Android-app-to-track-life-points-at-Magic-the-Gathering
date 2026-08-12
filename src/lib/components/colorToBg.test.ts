import { describe, expect, it } from 'vitest';
import { colorToBg } from './colorToBg';

describe('colorToBg', () => {
	it('maps supported single-color tokens to their expected hex colors', () => {
		expect(colorToBg('red')).toBe('#BB0000');
		expect(colorToBg('gold')).toBe('#FFB700');
		expect(colorToBg(' mud ')).toBe('#704214');
	});

	it('falls back to white for empty or unknown colors', () => {
		expect(colorToBg('')).toBe('#ffffff');
		expect(colorToBg('unknown')).toBe('#ffffff');
	});

	it('builds deterministic gradients from comma-separated player colors', () => {
		expect(colorToBg('red, blue,unknown')).toBe(
			'linear-gradient(to right top, #BB0000, #0000BB, #ffffff)'
		);
	});
});
