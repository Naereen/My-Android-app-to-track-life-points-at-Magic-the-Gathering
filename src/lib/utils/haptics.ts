import { get } from 'svelte/store';
import { appSettings } from '$lib/store/appSettings';

const isEnabled = (): boolean => {
	try {
		return !!(get(appSettings)?.hapticsEnabled ?? true);
	} catch (e) {
		return true;
	}
};

const canVibrate = (): boolean => typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const tap = (pattern: number | number[] = 10) => {
	if (!isEnabled()) return;
	if (!canVibrate()) return;
	try {
		navigator.vibrate(pattern as any);
	} catch (e) {
		// ignore
	}
};

export const confirm = () => tap([20, 10, 20]);
export const error = () => tap([40, 20, 40]);
