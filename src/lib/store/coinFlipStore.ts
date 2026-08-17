import { persist } from './persist';
import { writable } from 'svelte/store';

export type CoinSide = 'H' | 'T';

export interface FlipGroup {
	id: string;
	results: CoinSide[];
}

export interface FlipHistoryEntry {
	id: string;
	mode: 'manual' | 'untilLose';
	call: CoinSide | null;
	groups: FlipGroup[];
	heads: number;
	tails: number;
}

export interface CoinFlipState {
	krarkThumbs: number;
	coinsToFlip: number;
	totalHeads: number;
	totalTails: number;
	lastResults: FlipGroup[];
	flipHistory: FlipHistoryEntry[];
	lastRunWasCapped: boolean;
}

export const MAX_KRARK_THUMBS = 6;
export const MAX_COINS_TO_FLIP = 99;
export const MAX_FLIP_UNTIL_LOSE_ROUNDS = 24;

const initialCoinFlipState: CoinFlipState = {
	krarkThumbs: 0,
	coinsToFlip: 1,
	totalHeads: 0,
	totalTails: 0,
	lastResults: [],
	flipHistory: [],
	lastRunWasCapped: false
};

const clampKrarkThumbs = (count: number) =>
	Math.max(0, Math.min(MAX_KRARK_THUMBS, Math.floor(count || 0)));

const clampCoinsToFlip = (count: number) =>
	Math.max(1, Math.min(MAX_COINS_TO_FLIP, Math.floor(count || 1)));

const sanitizeGroup = (group: FlipGroup, fallbackIndex: number): FlipGroup => ({
	id: typeof group?.id === 'string' && group.id ? group.id : `restored-group-${fallbackIndex}`,
	results: Array.isArray(group?.results)
		? group.results.filter((result): result is CoinSide => result === 'H' || result === 'T')
		: []
});

const sanitizeHistoryEntry = (
	entry: FlipHistoryEntry,
	fallbackIndex: number
): FlipHistoryEntry | null => {
	if (!entry || typeof entry !== 'object') return null;

	const groups = Array.isArray(entry.groups)
		? entry.groups.map((group, index) => sanitizeGroup(group, index))
		: [];
	const heads =
		typeof entry.heads === 'number'
			? entry.heads
			: groups.reduce(
					(total, group) => total + group.results.filter((result) => result === 'H').length,
					0
				);
	const tails =
		typeof entry.tails === 'number'
			? entry.tails
			: groups.reduce(
					(total, group) => total + group.results.filter((result) => result === 'T').length,
					0
				);

	return {
		id: typeof entry.id === 'string' && entry.id ? entry.id : `restored-history-${fallbackIndex}`,
		mode: entry.mode === 'untilLose' ? 'untilLose' : 'manual',
		call: entry.call === 'H' || entry.call === 'T' ? entry.call : null,
		groups,
		heads,
		tails
	};
};

const sanitizeState = (state: CoinFlipState | undefined): CoinFlipState => {
	const lastResults = Array.isArray(state?.lastResults)
		? state.lastResults.map((group, index) => sanitizeGroup(group, index))
		: [];
	const flipHistory = Array.isArray(state?.flipHistory)
		? state.flipHistory
				.map((entry, index) => sanitizeHistoryEntry(entry, index))
				.filter((entry): entry is FlipHistoryEntry => entry !== null)
		: [];

	return {
		krarkThumbs: clampKrarkThumbs(state?.krarkThumbs ?? initialCoinFlipState.krarkThumbs),
		coinsToFlip: clampCoinsToFlip(state?.coinsToFlip ?? initialCoinFlipState.coinsToFlip),
		totalHeads: Math.max(0, Math.floor(state?.totalHeads ?? 0)),
		totalTails: Math.max(0, Math.floor(state?.totalTails ?? 0)),
		lastResults,
		flipHistory,
		lastRunWasCapped: Boolean(state?.lastRunWasCapped)
	};
};

const countSides = (groups: FlipGroup[]) =>
	groups.reduce(
		(counts, group) => {
			for (const result of group.results) {
				if (result === 'H') counts.heads += 1;
				else counts.tails += 1;
			}
			return counts;
		},
		{ heads: 0, tails: 0 }
	);

const flattenHistoryResults = (history: FlipHistoryEntry[]) =>
	history.flatMap((entry) => entry.groups.flatMap((group) => group.results));

const formatResultGroup = (
	group: FlipGroup,
	formatCoinSide: (result: CoinSide) => string = (result) => result
) => group.results.map(formatCoinSide).join('');

const getLongestStreak = (results: CoinSide[], side: CoinSide) => {
	let longest = 0;
	let current = 0;

	for (const result of results) {
		if (result === side) {
			current += 1;
			longest = Math.max(longest, current);
		} else {
			current = 0;
		}
	}

	return longest;
};

export const getCoinsPerGroup = (krarkThumbs: number) => 2 ** clampKrarkThumbs(krarkThumbs);

export const getTotalCoinsPerFlip = (state: Pick<CoinFlipState, 'krarkThumbs' | 'coinsToFlip'>) =>
	getCoinsPerGroup(state.krarkThumbs) * clampCoinsToFlip(state.coinsToFlip);

export const formatFlipGroups = (
	groups: FlipGroup[],
	formatCoinSide: (result: CoinSide) => string = (result) => result
) =>
	groups.length > 0
		? `( ${groups.map((group) => formatResultGroup(group, formatCoinSide)).join(', ')} )`
		: '—';

export const formatFlipHistory = (
	history: FlipHistoryEntry[],
	coinSideLabels: { head: string; tail: string } = { head: 'H', tail: 'T' }
) =>
	history.length > 0
		? history
				.map(
					(entry) =>
						`( ${entry.heads}${coinSideLabels.head} & ${entry.tails}${coinSideLabels.tail} )`
				)
				.join(', ')
		: '—';

export const getCoinFlipStatistics = (state: CoinFlipState) => {
	const flattenedResults = flattenHistoryResults(state.flipHistory);

	return {
		longestHeadsStreak: getLongestStreak(flattenedResults, 'H'),
		longestTailsStreak: getLongestStreak(flattenedResults, 'T')
	};
};

export const createCoinFlipStore = (random = Math.random) => {
	const store = persist<CoinFlipState>('coinFlipState', initialCoinFlipState);
	store.update((state) => sanitizeState(state));
	let generatedIdCount = 0;

	const createId = (prefix: string) => `${prefix}-${generatedIdCount++}`;

	const createFlipGroups = (groupCount: number, coinsPerGroup: number) =>
		Array.from({ length: groupCount }, () => ({
			id: createId('group'),
			results: Array.from({ length: coinsPerGroup }, () =>
				random() < 0.5 ? 'H' : 'T'
			) as CoinSide[]
		}));

	const buildHistoryEntry = (
		groups: FlipGroup[],
		mode: FlipHistoryEntry['mode'],
		call: CoinSide | null
	): FlipHistoryEntry => {
		const { heads, tails } = countSides(groups);

		return {
			id: createId('history'),
			mode,
			call,
			groups,
			heads,
			tails
		};
	};

	const updateWithNewEntry = (
		state: CoinFlipState,
		groups: FlipGroup[],
		mode: FlipHistoryEntry['mode'],
		call: CoinSide | null,
		lastRunWasCapped: boolean
	) => {
		const entry = buildHistoryEntry(groups, mode, call);

		return {
			...state,
			totalHeads: state.totalHeads + entry.heads,
			totalTails: state.totalTails + entry.tails,
			lastResults: groups,
			flipHistory: [...state.flipHistory, entry],
			lastRunWasCapped
		};
	};

	return {
		subscribe: store.subscribe,
		setKrarkThumbs: (count: number) => {
			store.update((state) => ({
				...state,
				krarkThumbs: clampKrarkThumbs(count)
			}));
		},
		setCoinsToFlip: (count: number) => {
			store.update((state) => ({
				...state,
				coinsToFlip: clampCoinsToFlip(count)
			}));
		},
		flipCoins: () => {
			store.update((state) => {
				const groups = createFlipGroups(
					clampCoinsToFlip(state.coinsToFlip),
					getCoinsPerGroup(state.krarkThumbs)
				);
				return updateWithNewEntry(state, groups, 'manual', null, false);
			});
		},
		flipUntilLose: (call: CoinSide) => {
			store.update((state) => {
				const groups: FlipGroup[] = [];
				const coinsPerGroup = getCoinsPerGroup(state.krarkThumbs);
				const groupCount = clampCoinsToFlip(state.coinsToFlip);
				let round = 0;
				let keepGoing = true;

				while (keepGoing && round < MAX_FLIP_UNTIL_LOSE_ROUNDS) {
					const roundGroups = createFlipGroups(groupCount, coinsPerGroup);
					groups.push(...roundGroups);
					keepGoing = roundGroups.some((group) => group.results.includes(call));
					round += 1;
				}

				return updateWithNewEntry(state, groups, 'untilLose', call, keepGoing);
			});
		},
		resetStats: () => {
			store.update((state) => ({
				...state,
				totalHeads: 0,
				totalTails: 0,
				lastResults: [],
				flipHistory: [],
				lastRunWasCapped: false
			}));
		}
	};
};

export const coinFlipStore = createCoinFlipStore();

export const coinFlipModalOpen = writable(false);

export const openCoinFlipModal = () => coinFlipModalOpen.set(true);

export const closeCoinFlipModal = () => coinFlipModalOpen.set(false);
