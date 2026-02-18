import { persist } from './persist';

export type GameHistoryEntryKind =
	| 'positiveLife'
	| 'negativeLife'
	| 'poison'
	| 'statusBoolean'
	| 'statusNumeric'
	| 'commanderDamage';

export type GameHistoryEntry = {
	id: string;
	timestamp: number;
	playerId: number;
	playerName: string;
	kind: GameHistoryEntryKind;
	payload: {
		key?: string;
		from?: number | boolean;
		to?: number | boolean;
		fromPlayerId?: number;
		lifeDelta?: number;
	};
};

const MAX_GAME_HISTORY_ENTRIES = 500;

export const gameHistory = persist<GameHistoryEntry[]>('gameHistory', []);

export const addGameHistoryEntry = (
	entry: Omit<GameHistoryEntry, 'id' | 'timestamp'>
) => {
	gameHistory.update((current) => {
		const randomId =
			typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
				? globalThis.crypto.randomUUID()
				: `${Date.now()}-${Math.random()}`;

		const nextEntry: GameHistoryEntry = {
			...entry,
			id: randomId,
			timestamp: Date.now()
		};

		const next = [...current, nextEntry];
		if (next.length > MAX_GAME_HISTORY_ENTRIES) {
			return next.slice(next.length - MAX_GAME_HISTORY_ENTRIES);
		}
		return next;
	});
};

export const clearGameHistory = () => {
	gameHistory.set([]);
};
