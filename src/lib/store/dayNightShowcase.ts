import { writable } from 'svelte/store';

export type DayNightPhase = 'day' | 'night';

interface DayNightShowcaseState {
	visible: boolean;
	phase: DayNightPhase;
	sequence: number;
}

const SHOWCASE_DURATION_MS = 2400;
const initialState: DayNightShowcaseState = {
	visible: false,
	phase: 'day',
	sequence: 0
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

const createDayNightShowcase = () => {
	const { subscribe, set, update } = writable<DayNightShowcaseState>(initialState);

	return {
		subscribe,
		show: (phase: DayNightPhase) => {
			if (hideTimer) {
				clearTimeout(hideTimer);
			}

			update((state) => ({
				visible: true,
				phase,
				sequence: state.sequence + 1
			}));

			hideTimer = setTimeout(() => {
				update((state) => ({ ...state, visible: false }));
				hideTimer = null;
			}, SHOWCASE_DURATION_MS);
		},
		hide: () => {
			if (hideTimer) {
				clearTimeout(hideTimer);
				hideTimer = null;
			}

			update((state) => ({ ...state, visible: false }));
		},
		reset: () => {
			if (hideTimer) {
				clearTimeout(hideTimer);
				hideTimer = null;
			}

			set(initialState);
		}
	};
};

export const dayNightShowcase = createDayNightShowcase();
export const showDayNightShowcase = (phase: DayNightPhase) => dayNightShowcase.show(phase);
export const hideDayNightShowcase = () => dayNightShowcase.hide();
export const resetDayNightShowcase = () => dayNightShowcase.reset();
export const dayNightShowcaseDurationMs = SHOWCASE_DURATION_MS;
