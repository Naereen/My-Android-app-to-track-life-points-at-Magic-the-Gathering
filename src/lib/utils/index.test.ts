import { describe, expect, it } from 'vitest';
import { formatWithUnderlineSixNine } from './index';

describe('formatWithUnderlineSixNine', () => {
	it('wraps digit 6 in an underline span', () => {
		const result = formatWithUnderlineSixNine(6);
		expect(result).toContain('<span');
		expect(result).toContain('text-decoration:underline');
		expect(result).toContain('>6<');
	});

	it('wraps digit 9 in an underline span', () => {
		const result = formatWithUnderlineSixNine(9);
		expect(result).toContain('<span');
		expect(result).toContain('text-decoration:underline');
		expect(result).toContain('>9<');
	});

	it('wraps only 6 and 9 within a multi-digit number', () => {
		const result = formatWithUnderlineSixNine(36);
		expect(result).toContain('3');
		// the '3' itself should not be inside a span
		expect(result).not.toMatch(/<span[^>]*>3<\/span>/);
		expect(result).toContain('>6<');
	});

	it('wraps both 6 and 9 when both appear in the same value', () => {
		const result = formatWithUnderlineSixNine(69);
		expect(result.match(/<span/g)?.length).toBe(2);
	});

	it('leaves digits other than 6 and 9 unchanged', () => {
		const result = formatWithUnderlineSixNine(12345780);
		expect(result).toBe('12345780');
	});

	it('handles negative numbers (sign passes through, 6/9 are underlined)', () => {
		const result = formatWithUnderlineSixNine(-6);
		expect(result).toContain('-');
		expect(result).toContain('>6<');
	});

	it('handles zero without modification', () => {
		expect(formatWithUnderlineSixNine(0)).toBe('0');
	});

	it('accepts a string input', () => {
		const result = formatWithUnderlineSixNine('+9');
		expect(result).toContain('+');
		expect(result).toContain('>9<');
	});
});
