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

// Haptics are intentionally centralized so every control shares the same user preference
// and the app never has to duplicate permission/support checks in component code.

/**
 * Triggers a vibration pattern if haptics are enabled in settings and supported by the device.
 * @param {number | number[]} pattern Milliseconds or vibration sequence passed to `navigator.vibrate`.
 * @returns {void}
 */
export const tap = (pattern: number | number[] = 20) => {
	if (!isEnabled()) return;
	if (!canVibrate()) return;
	try {
		navigator.vibrate(pattern as any);
	} catch (e) {
		console.log('Haptics vibration error:', e);
		// ignore
	}
};

/**
 * Plays a short positive haptic feedback pattern.
 * @returns {void}
 */
export const confirm = () => tap([20, 10, 20]);
/**
 * Plays a stronger error haptic feedback pattern.
 * @returns {void}
 */
export const error = () => tap([40, 20, 40]);

/**
 * Convenience wrapper to build a symmetric vibration pattern from a single intensity value.
 * @param {number} intensity Base duration used to scale the pulse sequence.
 * @returns {void}
 */
export function vibrate(intensity: number = 10) {
	// Symmetric pulse shape gives short feedback without feeling like a long buzzing alert.
	return tap([2 * intensity, intensity, 2 * intensity]);
}

// Svelte action to attach haptic feedback to an element without stopping event forwarding
/**
 * Svelte action that attaches click-triggered haptic feedback to an element.
 * @param {HTMLElement} node Target DOM element.
 * @param {number | number[]} pattern Initial vibration pattern.
 * @returns {{ update: (newPattern: number | number[]) => void; destroy: () => void }} Action lifecycle hooks.
 */
export function haptic(node: HTMLElement, pattern: number | number[] = 10) {
	let currentPattern = pattern;
	/**
	 * Handles click events and dispatches vibration with the latest pattern value.
	 * @returns {void}
	 */
	const handler = () => {
		// Keep the action passive so it behaves like a pure enhancement and never blocks
		// the click path used by buttons, links, and custom controls.
		try {
			if (!isEnabled()) return;
			if (!canVibrate()) return;
			navigator.vibrate(currentPattern as any);
		} catch (e) {
			console.log('Haptics vibration error:', e);
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
