// Heuristic of "mobile" detection combining multiple signals
// to improve accuracy across different environments and browsers.
// Returns true if any of the signals indicate a mobile device.
// innerWidth can be optionally provided as a final fallback check.
/**
 * Heuristically detects mobile devices using UA data, touch support and pointer capabilities.
 * @param {number} [innerWidth] Optional viewport width fallback when other signals are unavailable.
 * @returns {boolean} `true` when the runtime likely targets a phone/tablet form factor.
 */
export function isMobileDevice(innerWidth?: number): boolean {
	try {
		if (typeof navigator !== 'undefined') {
			// userAgentData (modern browsers) provides a reliable mobile hint
			const uaData: any = (navigator as any).userAgentData;
			if (uaData && typeof uaData.mobile === 'boolean') {
				// Prefer structured browser hints when available, because they survive UA spoofing
				// better than plain string matching.
				return uaData.mobile;
			}

			// userAgent fallback
			const ua = navigator.userAgent || '';
			const mobileRegex =
				/Mobi|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i;
			if (mobileRegex.test(ua)) {
				return true;
			}

			// Touch capabilities
			if (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0) {
				return true;
			}

			// Pointer coarseness (coarse usually means touch first)
			if (typeof window !== 'undefined' && 'matchMedia' in window) {
				try {
					if ((window as any).matchMedia('(pointer: coarse)').matches) {
						return true;
					}
				} catch (e) {
					// ignore
					console.log('isMobileDevice detection error:', e);
				}
			}
		}

		// Final fallback: use innerWidth when provided (threshold conservative)
		if (typeof innerWidth === 'number') {
			// Width fallback is deliberately conservative so tablets do not accidentally fall
			// into phone-only layout branches unless all other signals were inconclusive.
			return innerWidth <= 400;
		}
	} catch (e) {
		// defensive: don't crash in SSR or odd environments
		console.log('isMobileDevice detection error:', e);
	}
	return false;
}
