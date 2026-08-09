import { persist } from './persist';

export type GameHistoryEntryKind =
	| 'positiveLife'
	| 'negativeLife'
	| 'poison'
	| 'statusBoolean'
	| 'statusNumeric'
	| 'commanderDamage'
	| 'resourceChange'
	| 'resourceReset'
	| 'turnChange'
	| 'gameRestart'
	| 'diceRoll';

export type GameHistoryEntry = {
	id: string;
	timestamp: number;
	playerId: number;
	playerName: string;
	kind: GameHistoryEntryKind;
	mergeKey?: string;
	payload: {
		key?: string;
		from?: number | boolean;
		to?: number | boolean;
		sourceIndex?: number;
		diceSides?: number;
		diceResult?: number | string;
		fromPlayerId?: number;
		fromPlayerName?: string;
		lifeDelta?: number;
		toPlayerName?: string;
		fromTurn?: number;
		toTurn?: number;
	};
};

const MAX_GAME_HISTORY_ENTRIES = 500;
const MERGE_WINDOW_MS = 2000;
const MERGEABLE_STATUS_KEYS = new Set(['energy', 'experience', 'rad', 'acorn', 'ticket']);

export const gameHistory = persist<GameHistoryEntry[]>('gameHistory', []);

const canMergeEntries = (previous: GameHistoryEntry, next: Omit<GameHistoryEntry, 'id' | 'timestamp'>) => {
	if (previous.playerId !== next.playerId) return false;
	if (previous.kind !== next.kind) return false;
	if (Date.now() - previous.timestamp > MERGE_WINDOW_MS) return false;

	const previousFrom = previous.payload.from;
	const previousTo = previous.payload.to;
	const nextFrom = next.payload.from;
	const nextTo = next.payload.to;
	if (typeof previousFrom !== 'number' || typeof previousTo !== 'number') return false;
	if (typeof nextFrom !== 'number' || typeof nextTo !== 'number') return false;
	if (previousTo !== nextFrom) return false;

	if (previous.kind === 'poison') return true;
	if (previous.kind === 'positiveLife' || previous.kind === 'negativeLife') return true;
	if (previous.kind === 'statusNumeric') {
		const key = previous.payload.key;
		return !!key && MERGEABLE_STATUS_KEYS.has(key) && key === next.payload.key;
	}

	if (previous.kind === 'commanderDamage') {
		if (previous.payload.fromPlayerId !== next.payload.fromPlayerId) return false;
		if ((previous.payload.sourceIndex ?? 1) !== (next.payload.sourceIndex ?? 1)) return false;

		const previousDelta = previousTo - previousFrom;
		const nextDelta = nextTo - nextFrom;
		if (previousDelta === 0 || nextDelta === 0) return false;

		return Math.sign(previousDelta) === Math.sign(nextDelta);
	}

	return false;
};

const mergeEntries = (previous: GameHistoryEntry, next: Omit<GameHistoryEntry, 'id' | 'timestamp'>): GameHistoryEntry => {
	return {
		...previous,
		timestamp: Date.now(),
		playerId: next.playerId,
		playerName: next.playerName,
		kind: next.kind,
		mergeKey: next.mergeKey,
		payload: {
			...previous.payload,
			from: previous.payload.from,
			to: next.payload.to
		}
	};
};

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

		const previousEntry = current[current.length - 1];
		if (previousEntry && canMergeEntries(previousEntry, entry)) {
			const mergedEntry = mergeEntries(previousEntry, entry);
			const merged = [...current.slice(0, -1), mergedEntry];
			if (merged.length > MAX_GAME_HISTORY_ENTRIES) {
				return merged.slice(merged.length - MAX_GAME_HISTORY_ENTRIES);
			}
			return merged;
		}

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
