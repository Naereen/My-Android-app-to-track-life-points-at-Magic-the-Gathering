import { writable, type Writable } from 'svelte/store';

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export function persist<T>(key: string, initial: T): Writable<T> {
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
