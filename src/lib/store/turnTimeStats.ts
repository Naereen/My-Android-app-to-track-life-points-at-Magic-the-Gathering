import { derived, get } from 'svelte/store';
import { persist } from './persist';

const MAX_PLAYER_SLOTS = 8;

type TurnTimeStatsState = {
	// Cumulative seconds per player index (0-based, up to MAX_PLAYER_SLOTS)
	playerSeconds: number[];
	// Wall-clock ms when the current player's turn started (null = no active turn)
	currentTurnStartMs: number | null;
	// Index of the player whose turn is currently being timed
	currentPlayerIndex: number | null;
};

const DEFAULT_STATE: TurnTimeStatsState = {
	playerSeconds: Array(MAX_PLAYER_SLOTS).fill(0),
	currentTurnStartMs: null,
	currentPlayerIndex: null
};

export const turnTimeStats = persist<TurnTimeStatsState>('turnTimeStats', DEFAULT_STATE);

/**
 * Records turn start for a player. If another player was active, their elapsed time
 * is accumulated first so switching turns never loses tracked time.
 */
export const startTurnFor = (playerIndex: number) => {
	const now = Date.now();
	turnTimeStats.update((s) => {
		const newTimes = [...s.playerSeconds];
		// Flush time for the previous player before switching
		if (s.currentPlayerIndex !== null && s.currentTurnStartMs !== null) {
			const elapsed = Math.floor((now - s.currentTurnStartMs) / 1000);
			if (elapsed > 0) {
				newTimes[s.currentPlayerIndex] = (newTimes[s.currentPlayerIndex] ?? 0) + elapsed;
			}
		}
		return {
			playerSeconds: newTimes,
			currentTurnStartMs: now,
			currentPlayerIndex: playerIndex
		};
	});
};

/**
 * Stops tracking the current player's turn and accumulates elapsed seconds.
 * Called when a turn ends without a new player starting immediately (e.g. game pause).
 */
export const endCurrentTurn = () => {
	const now = Date.now();
	turnTimeStats.update((s) => {
		if (s.currentPlayerIndex === null || s.currentTurnStartMs === null) return s;
		const elapsed = Math.floor((now - s.currentTurnStartMs) / 1000);
		const newTimes = [...s.playerSeconds];
		if (elapsed > 0) {
			newTimes[s.currentPlayerIndex] = (newTimes[s.currentPlayerIndex] ?? 0) + elapsed;
		}
		return { ...s, playerSeconds: newTimes, currentTurnStartMs: null, currentPlayerIndex: null };
	});
};

/** Resets all time tracking (call on game restart). */
export const resetTurnTimeStats = () => {
	turnTimeStats.set({ ...DEFAULT_STATE, playerSeconds: Array(MAX_PLAYER_SLOTS).fill(0) });
};

/**
 * Derived store: for each player index, returns committed seconds plus live elapsed
 * seconds for the currently active player. Recalculated on every store update; the
 * live portion is a snapshot at subscription time (no sub-second ticking needed for
 * a percentage display).
 */
export const turnTimeStatsSummary = derived(turnTimeStats, ($s) => {
	const now = Date.now();
	const times = $s.playerSeconds.map((sec, idx) => {
		if (idx === $s.currentPlayerIndex && $s.currentTurnStartMs !== null) {
			return sec + Math.max(0, Math.floor((now - $s.currentTurnStartMs) / 1000));
		}
		return sec;
	});
	const total = times.reduce((acc, t) => acc + t, 0);
	return { times, total };
});

/** Returns live elapsed seconds for the current player (snapshot at call time). */
export const getLivePlayerSeconds = (playerIndex: number): number => {
	const s = get(turnTimeStats);
	const committed = s.playerSeconds[playerIndex] ?? 0;
	if (s.currentPlayerIndex === playerIndex && s.currentTurnStartMs !== null) {
		return committed + Math.max(0, Math.floor((Date.now() - s.currentTurnStartMs) / 1000));
	}
	return committed;
};

/** Formats a duration in seconds to mm:ss. */
export const formatDuration = (totalSeconds: number): string => {
    // also display HH:MM:SS if hour HH is > 0
	const s = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(s / 3600);
	const minutes = Math.floor((s % 3600) / 60);
	const seconds = s % 60;
	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
