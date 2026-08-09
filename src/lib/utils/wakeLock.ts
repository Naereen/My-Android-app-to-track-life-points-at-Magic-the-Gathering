let wakeLock: any = null;
let keepAwake = false;

/**
 * Checks whether the browser exposes the Screen Wake Lock API.
 * @returns {boolean} `true` when `navigator.wakeLock` is available.
 */
const isSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/**
 * Attempts to acquire a screen wake lock and keeps a reference to the lock sentinel.
 * @returns {Promise<void>}
 */
async function requestWakeLock() {
	if (!isSupported()) return;
	try {
		// @ts-ignore - Wake Lock API
		wakeLock = await (navigator as any).wakeLock.request('screen');
		wakeLock.addEventListener?.('release', () => {
			wakeLock = null;
			console.debug('Wake Lock released');
		});
		console.debug('Wake Lock acquired');
	} catch (err: any) {
		console.warn('Could not acquire Wake Lock:', err?.name || err);
	}
}

/**
 * Releases the active wake lock if one is currently held.
 * @returns {Promise<void>}
 */
async function releaseWakeLock() {
	if (!wakeLock) return;
	try {
		await wakeLock.release();
	} catch (err) {
		// ignore
	}
	wakeLock = null;
}

/**
 * Re-acquires wake lock when tab becomes visible and preference is enabled.
 * Releases lock when tab goes to background to avoid unnecessary battery drain.
 * @returns {void}
 */
function handleVisibilityChange() {
	if (document.visibilityState === 'visible' && keepAwake) {
		requestWakeLock();
	} else if (document.visibilityState !== 'visible') {
		// optional: release when hidden to save battery
		releaseWakeLock();
	}
}

/**
 * Toggles the keep-awake policy for the application.
 * Immediately acquires or releases the wake lock based on current visibility state.
 * @param {boolean} enable Whether screen should be kept awake while the app is visible.
 * @returns {void}
 */
export function setKeepAwake(enable: boolean) {
	keepAwake = !!enable;
	if (keepAwake) {
		if (document.visibilityState === 'visible') requestWakeLock();
	} else {
		releaseWakeLock();
	}
}

/**
 * Starts wake-lock lifecycle listeners for visibility changes and page unload.
 * @returns {void}
 */
export function initWakeLock() {
	if (typeof document === 'undefined') return;
	document.addEventListener('visibilitychange', handleVisibilityChange);
	window.addEventListener('beforeunload', () => releaseWakeLock());
}

/**
 * Stops wake-lock lifecycle handling and releases any active lock.
 * @returns {void}
 */
export function stopWakeLockManager() {
	if (typeof document === 'undefined') return;
	document.removeEventListener('visibilitychange', handleVisibilityChange);
	releaseWakeLock();
}

export default {
	initWakeLock,
	setKeepAwake,
	stopWakeLockManager
};
