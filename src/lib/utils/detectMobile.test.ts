import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMobileDevice } from './detectMobile';

describe('isMobileDevice', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('prefers userAgentData mobile hints when available', () => {
		vi.stubGlobal('navigator', {
			userAgentData: { mobile: true },
			userAgent: 'Desktop Browser',
			maxTouchPoints: 0
		});

		expect(isMobileDevice()).toBe(true);
	});

	it('detects mobile browsers from the user agent string', () => {
		vi.stubGlobal('navigator', {
			userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
			maxTouchPoints: 0
		});

		expect(isMobileDevice()).toBe(true);
	});

	it('treats touch-capable devices as mobile when no UA hint is present', () => {
		vi.stubGlobal('navigator', {
			userAgent: 'Desktop Browser',
			maxTouchPoints: 5
		});

		expect(isMobileDevice()).toBe(true);
	});

	it('falls back to coarse pointers and viewport width when needed', () => {
		vi.stubGlobal('navigator', {
			userAgent: 'Desktop Browser',
			maxTouchPoints: 0
		});
		vi.stubGlobal('window', {
			matchMedia: vi.fn(() => ({ matches: true }))
		});

		expect(isMobileDevice(1024)).toBe(true);

		vi.unstubAllGlobals();
		expect(isMobileDevice(375)).toBe(true);
		expect(isMobileDevice(640)).toBe(false);
	});

	it('swallows detection errors and returns a safe fallback result', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
		vi.stubGlobal('navigator', {
			get userAgent() {
				throw new Error('bad navigator');
			}
		});

		expect(isMobileDevice(390)).toBe(false);
		expect(consoleSpy).toHaveBeenCalled();
	});
});
