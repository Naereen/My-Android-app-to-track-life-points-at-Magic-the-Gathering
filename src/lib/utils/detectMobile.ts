// Heuristic of "mobile" detection combining multiple signals
// to improve accuracy across different environments and browsers.
// Returns true if any of the signals indicate a mobile device.
// innerWidth can be optionally provided as a final fallback check.
export function isMobileDevice(innerWidth?: number): boolean {
    try {
        if (typeof navigator !== 'undefined') {
        // userAgentData (modern browsers) provides a reliable mobile hint
        const uaData: any = (navigator as any).userAgentData;
        if (uaData && typeof uaData.mobile === 'boolean') return uaData.mobile;

        // userAgent fallback
        const ua = navigator.userAgent || '';
        const mobileRegex = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i;
        if (mobileRegex.test(ua)) return true;

        // Touch capabilities
        if (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0) return true;

        // Pointer coarseness (coarse usually means touch first)
        if (typeof window !== 'undefined' && 'matchMedia' in window) {
            try {
            if ((window as any).matchMedia('(pointer: coarse)').matches) return true;
            } catch (e) {
            // ignore
            }
        }
        }

        // Final fallback: use innerWidth when provided (threshold conservative)
        if (typeof innerWidth === 'number') return innerWidth <= 900;
    } catch (e) {
        // defensive: don't crash in SSR or odd environments
    }
    return false;
}
