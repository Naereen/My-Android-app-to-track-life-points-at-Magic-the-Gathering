import { persist } from './persist';
import { secureRandomInt } from '$lib/utils/cryptoRandom';

export type SavedGamePlayerStat = {
	name: string;
	lifeAtEnd: number;
	turnSeconds: number;
};

export type SavedGame = {
	id: string;
	/** Unix ms when the game ended (reset triggered). */
	timestamp: number;
	/** Unix ms of the first recorded life snapshot (game start). */
	startTimestamp: number;
	/** Total game duration in seconds. */
	durationSeconds: number;
	/** Number of active players in the game. */
	playerCount: number;
	/** Starting life total configured for the game. */
	startingLife: number;
	/** 0-based index of the player who went first, or null if unknown. */
	startingPlayerIndex: number | null;
	/** Turn number when the game ended, or null/undefined when turn tracking was never started. */
	endingTurnCount?: number | null;
	/** Per-player statistics (ordered by player slot index). */
	playerStats: SavedGamePlayerStat[];
	/**
	 * Index into `playerStats` of the winner, or null when the game was a draw
	 * (no single survivor with life > 0).
	 */
	winnerIndex: number | null;
};

const MAX_SAVED_GAMES = 100;

export const savedGames = persist<SavedGame[]>('savedGames', []);

/**
 * Appends a completed game record to the persistent saved-games list.
 * Older entries are pruned to stay within the cap.
 */
export const recordCompletedGame = (game: Omit<SavedGame, 'id'>) => {
	const id =
		typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
			? globalThis.crypto.randomUUID()
			: `${Date.now()}-${secureRandomInt(0, 0xffffffff).toString(16)}`;

	savedGames.update((current) => {
		const next = [...current, { ...game, id }];
		if (next.length > MAX_SAVED_GAMES) {
			return next.slice(next.length - MAX_SAVED_GAMES);
		}
		return next;
	});
};

/**
 * Removes all saved completed game records.
 */
export const clearSavedGames = () => {
	savedGames.set([]);
};
