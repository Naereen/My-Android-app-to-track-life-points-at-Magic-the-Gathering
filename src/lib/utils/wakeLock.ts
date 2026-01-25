let wakeLock: any = null;
let keepAwake = false;

const isSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

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

async function releaseWakeLock() {
    if (!wakeLock) return;
    try {
        await wakeLock.release();
    } catch (err) {
        // ignore
    }
    wakeLock = null;
}

function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && keepAwake) {
        requestWakeLock();
    } else if (document.visibilityState !== 'visible') {
        // optional: release when hidden to save battery
        releaseWakeLock();
    }
}

export function setKeepAwake(enable: boolean) {
    keepAwake = !!enable;
    if (keepAwake) {
        if (document.visibilityState === 'visible') requestWakeLock();
    } else {
        releaseWakeLock();
    }
}

export function initWakeLock() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => releaseWakeLock());
}

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
