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

export const tap = (pattern: number | number[] = 20) => {
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

export function vibrate(intensity: number = 10) {
	return tap([2*intensity, intensity, 2*intensity]);
}

// Svelte action to attach haptic feedback to an element without stopping event forwarding
export function haptic(node: HTMLElement, pattern: number | number[] = 10) {
	let currentPattern = pattern;
	const handler = () => {
		try {
			if (!isEnabled()) return;
			if (!canVibrate()) return;
			navigator.vibrate(currentPattern as any);
		} catch (e) {
			// ignore
		}
	};

	node.addEventListener('click', handler, { passive: true });

	return {
		update(newPattern: number | number[]) {
			currentPattern = newPattern;
		},
		destroy() {
			node.removeEventListener('click', handler as EventListener);
		}
	};
}
