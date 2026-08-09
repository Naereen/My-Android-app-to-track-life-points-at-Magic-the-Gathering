import { writable, type Writable } from 'svelte/store';

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export function persist<T>(key: string, initial: T): Writable<T> {
	// SSR-safe design: initialize from code defaults on server, then hydrate from
	// localStorage only in browser. This prevents SSR crashes and hydration mismatches.
	let startingValue = initial;

	if (isBrowser) {
		try {
			const raw = localStorage.getItem(key);
			if (raw) startingValue = JSON.parse(raw) as T;
		} catch (e) {
			// ignore parse errors and fall back to initial
		}
	}

	const store = writable<T>(startingValue);

	if (isBrowser) {
		// Storage writes are best-effort: quota errors must not break gameplay state updates.
		store.subscribe((value) => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch (e) {
				// ignore quota/write errors
			}
		});
	}

	return store;
}
