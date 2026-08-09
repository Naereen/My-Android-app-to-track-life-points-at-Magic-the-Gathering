import { get, writable, type Writable } from 'svelte/store';
import { appSettings } from './appSettings';
import { _ } from 'svelte-i18n'; // i18n language toggle
import { showConfirm, selectRandomPlayer } from '$lib/store/modal';
import { setCurrentTurn, appState, setDayNightCycleEnabled } from './appState';
import { persist } from './persist';
import { vibrate } from '$lib/utils/haptics';
import {
	playGameplaySound,
	playLifeLongStepSound,
	playLifeTapBurstSound
} from '$lib/utils/gameplaySound';
import { addGameHistoryEntry, clearGameHistory } from './gameHistory';
import {
	clearLifeHistory,
	lifeHistory,
	recordImmediateSnapshot,
	recordSnapshot
} from './lifeHistory';
import { resetResources } from './resources';
import { globalGameTimer } from './globalGameTimer';
import { searchVanguardCards, type ScryfallEmblemCard } from '$lib/utils/scryfall';
import {
	fetchTreacheryCardBySlug,
	getRequiredTreacheryRoleCounts,
	loadTreacheryCatalog,
	type TreacheryCard,
	type TreacheryCatalogEntry,
	type TreacheryRole
} from '$lib/utils/treachery';
import { pickWeightedIndex } from '$lib/utils/weightedRandom';
// import { chooseRandom, doSearch } from '$lib/components/modals/playerDataModal/PlayerDataModal';

const playerBaseName = get(_)('player') || 'Player';

// List of planeswalker names from Magic: The Gathering, to use as random player names.
// Source: https://mtg.wiki/Planeswalkers and https://yawgatog.com/resources/magic-rules/#R2053j
const popularPlaneswalkerNames: Record<string, string[]> = {
	A: ['Ajani', 'Aminatou', 'Angrath', 'Arlinn', 'Ashiok'],
	B: ['Bahamut', 'Basri', 'Bolas'],
	C: ['Calix', 'Chandra', 'Comet'],
	D: ['Dack', 'Dakkon', 'Daretti', 'Davriel', 'Dihada', 'Domri', 'Dovin'],
	E: ['Ellywick', 'Elminster', 'Elspeth', 'Estrid'],
	F: ['Freyalise'],
	G: ['Garruk', 'Gideon', 'Grist', 'Guff'],
	H: ['Huatli'],
	J: ['Jace', 'Jared', 'Jaya', 'Jeska'],
	K: ['Kaito', 'Karn', 'Kasmina', 'Kaya', 'Kiora', 'Koth'],
	L: ['Liliana', 'Lolth', 'Lukka'],
	M: ['Minsc', 'Mordenkainen'],
	N: ['Nahiri', 'Narset', 'Niko', 'Nissa', 'Nixilis'],
	O: ['Oko'],
	Q: ['Quintorius'],
	R: ['Ral', 'Rowan'],
	S: ['Saheeli', 'Samut', 'Sarkhan', 'Serra', 'Sivitri', 'Sorin', 'Szat'],
	T: ['Tamiyo', 'Tasha', 'Teferi', 'Teyo', 'Tezzeret', 'Tibalt', 'Tyvar'],
	U: ['Ugin', 'Urza'],
	V: ['Venser', 'Vivien', 'Vraska', 'Vronos'],
	W: ['Will', 'Windgrace', 'Wrenn'],
	X: ['Xenagos'],
	Y: ['Yanggu', 'Yanling'],
	Z: ['Zariel']
};

const allPlaneswalkerNames = Object.values(popularPlaneswalkerNames).flat();

const generateUniqueRandomPlayerNames = (count: number): string[] => {
	if (count <= 0) {
		return [];
	}

	const shuffledBaseNames = shuffle([...allPlaneswalkerNames]);
	if (count <= shuffledBaseNames.length) {
		return shuffledBaseNames.slice(0, count);
	}

	// Safety fallback: keep names distinct even if count exceeds the known list.
	const uniqueNames = [...shuffledBaseNames];
	for (let i = shuffledBaseNames.length; i < count; i++) {
		const baseName = allPlaneswalkerNames[i % allPlaneswalkerNames.length];
		const cycle = Math.floor(i / allPlaneswalkerNames.length) + 1;
		uniqueNames.push(`${baseName} ${cycle}`);
	}

	return uniqueNames;
};

const defaultPlayers: App.Player.Data[] = [
	// Keep a full 8-seat scaffold even for smaller games.
	// This stabilizes persistence shape and avoids re-allocating nested status fields
	// each time player count changes mid-session.
	{
		id: 1,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: 'Player 1',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		vanguard: null,
		vanguardChoices: [],
		treacheryRole: null,
		treacheryCard: null,
		treacherySeen: false,
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 2,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: 'Player 2',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		vanguard: null,
		vanguardChoices: [],
		treacheryRole: null,
		treacheryCard: null,
		treacherySeen: false,
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 3,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: 'Player 3',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		vanguard: null,
		vanguardChoices: [],
		treacheryRole: null,
		treacheryCard: null,
		treacherySeen: false,
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 4,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: 'Player 4',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		vanguard: null,
		vanguardChoices: [],
		treacheryRole: null,
		treacheryCard: null,
		treacherySeen: false,
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 5,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: 'Player 5',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		vanguard: null,
		vanguardChoices: [],
		treacheryRole: null,
		treacheryCard: null,
		treacherySeen: false,
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 6,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: 'Player 6',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		vanguard: null,
		vanguardChoices: [],
		treacheryRole: null,
		treacheryCard: null,
		treacherySeen: false,
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 7,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: 'Player 7',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		vanguard: null,
		vanguardChoices: [],
		treacheryRole: null,
		treacheryCard: null,
		treacherySeen: false,
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 8,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: 'Player 8',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		vanguard: null,
		vanguardChoices: [],
		treacheryRole: null,
		treacheryCard: null,
		treacherySeen: false,
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	}
];

// Helper to decide initial players array.
const getInitialPlayers = (): App.Player.Data[] => {
	// If running in browser and no saved players exist, assign random colors
	if (typeof window !== 'undefined') {
		try {
			const raw = localStorage.getItem('players');
			if (!raw) {
				// Two-part color token format (`primary,accent`) is consumed by `colorToBg`.
				// Keeping this format here avoids scattered color bootstrap logic.
				// choose between all the colors for backgrounds
				const first_choices = ['white', 'blue', 'black', 'red', 'green'];
				const second_choices = [
					'mud',
					'metalicgray',
					'gold',
					'purple',
					'pink',
					'orange',
					'lightgreen'
				];
				const randomNames = generateUniqueRandomPlayerNames(defaultPlayers.length);
				return defaultPlayers.map((p) => ({
					...p,
					playerName: randomNames[p.id - 1] || `${playerBaseName} ${p.id}`,
					color: `${first_choices[Math.floor(Math.random() * first_choices.length)]},${second_choices[Math.floor(Math.random() * second_choices.length)]}`
				}));
			}

			// If saved players exist, try to parse and return them synchronously
			const parsed = JSON.parse(raw as string);
			if (Array.isArray(parsed)) {
				return parsed as App.Player.Data[];
			}
		} catch (e) {
			// if any error, fall back to defaults
		}
	}

	// Fallback: return default players (async image fetching is handled elsewhere)
	return defaultPlayers;
};

export const players: Writable<App.Player.Data[]> = persist('players', getInitialPlayers());
export const lifeChangeHistoryResetKey = writable(0);

export const COMMANDER_DAMAGE_SOURCE_SLOTS = 2;
export const COMMANDER_TAX_SOURCE_SLOTS = 2;

/**
 * Normalizes commander damage/tax counters into an integer range accepted by the UI.
 * @param {number} value Raw numeric value.
 * @returns {number} Rounded value clamped to `0..999`.
 */
const clampCommanderDamageAmount = (value: number) => {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(999, Math.round(value)));
};

const normalizeCommanderDamagePair = (value: unknown): number[] => {
	if (!Array.isArray(value)) {
		return [0, 0];
	}

	const first = clampCommanderDamageAmount(Number(value[0] ?? 0));
	const second = clampCommanderDamageAmount(Number(value[1] ?? 0));
	return [first, second];
};

const normalizeCommandTaxPair = (value: unknown): [number, number] => {
	if (!Array.isArray(value)) {
		return [0, 0];
	}

	const first = clampCommanderDamageAmount(Number(value[0] ?? 0));
	const second = clampCommanderDamageAmount(Number(value[1] ?? 0));
	return [first, second];
};

export const getCommanderDamageBySourceForPlayer = (
	player: App.Player.Data | undefined,
	playerSlots = get(appSettings).playerCount
): number[][] => {
	const normalizedSlots = Math.max(2, Math.min(8, Math.floor(playerSlots || 4)));
	const bySource = player?.statusEffects?.commanderDamageBySource;

	if (Array.isArray(bySource)) {
		return Array.from({ length: normalizedSlots }, (_, index) =>
			normalizeCommanderDamagePair(bySource[index])
		);
	}

	const legacy = Array.isArray(player?.statusEffects?.commanderDamage)
		? player?.statusEffects?.commanderDamage
		: [];
	return Array.from({ length: normalizedSlots }, (_, index) => [
		clampCommanderDamageAmount(Number(legacy[index] ?? 0)),
		0
	]);
};

export const getCommanderDamageTotalsForPlayer = (
	player: App.Player.Data | undefined,
	playerSlots = get(appSettings).playerCount
): number[] => {
	return getCommanderDamageBySourceForPlayer(player, playerSlots).map((pair) => pair[0] + pair[1]);
};

export const getCommanderDamageTotalFromPlayer = (
	player: App.Player.Data | undefined,
	fromPlayerId: number,
	playerSlots = get(appSettings).playerCount
): number => {
	const totals = getCommanderDamageTotalsForPlayer(player, playerSlots);
	return totals[fromPlayerId - 1] ?? 0;
};

export const getCommanderDamageSourceValue = (
	player: App.Player.Data | undefined,
	fromPlayerId: number,
	sourceIndex: number,
	playerSlots = get(appSettings).playerCount
): number => {
	const sourceSlot = sourceIndex === 1 ? 1 : 0;
	const bySource = getCommanderDamageBySourceForPlayer(player, playerSlots);
	return bySource[fromPlayerId - 1]?.[sourceSlot] ?? 0;
};

export const getMaxCommanderDamageSingleSource = (
	player: App.Player.Data | undefined,
	playerSlots = get(appSettings).playerCount
): number => {
	const bySource = getCommanderDamageBySourceForPlayer(player, playerSlots);
	let maxDamage = 0;
	for (const pair of bySource) {
		maxDamage = Math.max(maxDamage, pair[0] ?? 0, pair[1] ?? 0);
	}
	return maxDamage;
};

export const getCommandTaxBySourceForPlayer = (
	player: App.Player.Data | undefined
): [number, number] => {
	const bySource = player?.statusEffects?.commandTaxBySource;
	if (Array.isArray(bySource)) {
		const pair = normalizeCommandTaxPair(bySource);
		if (!player?.statusEffects?.partnerMode) {
			return [pair[0] + pair[1], 0];
		}
		return pair;
	}

	const legacy = clampCommanderDamageAmount(Number(player?.statusEffects?.commandTax ?? 0));
	return [legacy, 0];
};

export const getCommandTaxTotalForPlayer = (player: App.Player.Data | undefined): number => {
	const [first, second] = getCommandTaxBySourceForPlayer(player);
	return first + second;
};

export const setPlayerCommandTax = (
	playerId: number,
	amount: number,
	sourceIndex = 0,
	mergeKey?: string
) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	if (!targetBefore) return;

	const sourceSlot = sourceIndex === 1 ? 1 : 0;
	const snapshot = getPlayerSnapshot(playerId);
	const oldPair = getCommandTaxBySourceForPlayer(targetBefore);
	const oldValue = oldPair[sourceSlot] ?? 0;
	const oldTotal = oldPair[0] + oldPair[1];
	const nextValue = clampCommanderDamageAmount(amount);
	if (oldValue === nextValue) return;

	const newPair: [number, number] = [oldPair[0], oldPair[1]];
	newPair[sourceSlot] = nextValue;
	const newTotal = newPair[0] + newPair[1];

	const autoMergeKey =
		mergeKey ??
		(Math.abs(nextValue - oldValue) === 1
			? `status:${playerId}:commandTax:${sourceSlot}:${nextValue > oldValue ? 'add' : 'subtract'}`
			: undefined);

	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id !== playerId) return player;

			const statusEffects = player.statusEffects ? { ...player.statusEffects } : {};
			statusEffects.commandTaxBySource = [newPair[0], newPair[1]];
			statusEffects.commandTax = newTotal;

			return {
				...player,
				statusEffects
			};
		});
	});

	if (snapshot) {
		addGameHistoryEntry({
			playerId: snapshot.id,
			playerName: snapshot.playerName,
			kind: 'statusNumeric',
			mergeKey: autoMergeKey,
			payload: {
				key: 'commandTax',
				sourceIndex: sourceSlot + 1,
				from: oldTotal,
				to: newTotal,
				fromSource: oldValue,
				toSource: nextValue
			}
		});
	}
};

export const isPartnerModeEnabledForPlayer = (playerId: number): boolean => {
	const player = get(players).find((p) => p.id === playerId);
	return !!player?.statusEffects?.partnerMode;
};

/**
 * Enables or disables partner mode for one player.
 * Disabling merges partner damage/tax back into single-source counters for compatibility.
 * @param {number} playerId Target player id.
 * @param {boolean} enabled Partner mode toggle.
 * @returns {void}
 */
export const setPlayerPartnerMode = (playerId: number, enabled: boolean) => {
	const normalized = !!enabled;

	updatePlayersAndPlayEliminationSounds((currentPlayers) => {
		const playerSlots = Math.max(2, Math.min(8, currentPlayers.length));

		return currentPlayers.map((player) => {
			const baseStatusEffects = player.statusEffects ? { ...player.statusEffects } : {};

			if (player.id === playerId) {
				baseStatusEffects.partnerMode = normalized;
				if (!normalized) {
					const [firstTax] = getCommandTaxBySourceForPlayer(player);
					baseStatusEffects.commandTaxBySource = [firstTax, 0];
					baseStatusEffects.commandTax = firstTax;
				}
				return {
					...player,
					statusEffects: baseStatusEffects
				};
			}

			if (normalized) {
				return player;
			}

			const bySource = getCommanderDamageBySourceForPlayer(player, playerSlots).map((pair) =>
				pair.slice(0, COMMANDER_DAMAGE_SOURCE_SLOTS)
			);
			const sourcePair = bySource[playerId - 1] ?? [0, 0];
			const secondaryDamage = sourcePair[1] ?? 0;

			if (secondaryDamage <= 0) {
				return player;
			}

			bySource[playerId - 1] = [sourcePair[0] ?? 0, 0];
			const commanderDamage = bySource.map((pair) => pair[0] + pair[1]);

			return {
				...player,
				lifeTotal: player.lifeTotal + secondaryDamage,
				statusEffects: {
					...baseStatusEffects,
					commanderDamage,
					commanderDamageBySource: bySource
				}
			};
		});
	});

	recordSnapshot(get(players));
};

if (get(lifeHistory).length === 0) {
	recordImmediateSnapshot(get(players));
}

/**
 * Evaluates whether a player is eliminated under current game rules.
 * Checks life total policy, explicit KO marker, and commander-damage threshold.
 * @param {App.Player.Data} player Player state to evaluate.
 * @returns {boolean} `true` when player should be treated as out of the game.
 */
const isEliminated = (player: App.Player.Data) => {
	const globalAllowNegative = get(appSettings).allowNegativeLife || false;
	const allowNegative = globalAllowNegative || !!player.allowNegativeLife;
	const maxCommanderDamage = getMaxCommanderDamageSingleSource(player);
	return (
		(!allowNegative && player.lifeTotal <= 0) ||
		player.statusEffects?.ko === true ||
		maxCommanderDamage >= 21
	);
};

/**
 * Determines if a player can go below zero for life calculations.
 * @param {App.Player.Data} player Player record.
 * @param {number} [nextLifeTotal] Optional projected life total after pending operation.
 * @returns {boolean} `true` when negative values are allowed or already implied by state.
 */
const canUseNegativeLife = (player: App.Player.Data, nextLifeTotal?: number) => {
	const globalAllowNegative = get(appSettings).allowNegativeLife || false;
	const allowNegative = globalAllowNegative || !!player.allowNegativeLife;
	if (allowNegative) return true;

	// Keep counting below zero when the player is already at 0 or crosses it.
	if (player.lifeTotal <= 0) return true;
	if (typeof nextLifeTotal === 'number' && nextLifeTotal <= 0) return true;
	if (isEliminated(player)) return true;

	return false;
};

/**
 * Counts non-eliminated players among active seats.
 * @param {App.Player.Data[]} list Full players array.
 * @returns {number} Number of players still alive.
 */
const alivePlayersCount = (list: App.Player.Data[]) => {
	const count = get(appSettings).playerCount;
	return list.slice(0, count).filter((player) => !isEliminated(player)).length;
};

const playEliminationSoundsIfNeeded = (
	beforePlayers: App.Player.Data[],
	afterPlayers: App.Player.Data[]
) => {
	const beforeById = new Map(beforePlayers.map((player) => [player.id, player]));
	const trackedAfterPlayers = afterPlayers.slice(0, get(appSettings).playerCount);

	const koOccurred = trackedAfterPlayers.some((player) => {
		const beforePlayer = beforeById.get(player.id);
		if (!beforePlayer) return false;
		return !isEliminated(beforePlayer) && isEliminated(player);
	});

	if (koOccurred) {
		playGameplaySound('ko');
	}

	const beforeAlive = alivePlayersCount(beforePlayers);
	const afterAlive = alivePlayersCount(afterPlayers);
	if (beforeAlive > 1 && afterAlive === 1) {
		playGameplaySound('victory');
	}
};

const updatePlayersAndPlayEliminationSounds = (
	updater: (currentPlayers: App.Player.Data[]) => App.Player.Data[]
) => {
	const beforePlayers = get(players);
	const afterPlayers = updater(beforePlayers);
	players.set(afterPlayers);
	playEliminationSoundsIfNeeded(beforePlayers, afterPlayers);
};

/**
 * Captures minimal immutable identity used by history entries.
 * @param {number} playerId Player id.
 * @returns {{ id: number; playerName: string } | null} Snapshot or `null` when player is missing.
 */
const getPlayerSnapshot = (playerId: number) => {
	const target = get(players).find((player) => player.id === playerId);
	if (!target) return null;
	return {
		id: target.id,
		playerName: target.playerName
	};
};

/**
 * Sets display color/gradient token for a player profile.
 * @param {number} playerId Target player id.
 * @param {string} color Stored color token (single color or comma-separated gradient seed).
 * @returns {void}
 */
export const setPlayerColor = (playerId: number, color: string) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					color
				};
			}
			return player;
		});
	});
};

/**
 * Overrides negative-life policy for one player.
 * @param {number} playerId Target player id.
 * @param {boolean} allow Whether this player may go below zero regardless of global rule.
 * @returns {void}
 */
export const setPlayerAllowNegative = (playerId: number, allow: boolean) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					allowNegativeLife: allow
				};
			}
			return player;
		});
	});
};

/**
 * Assigns selected Vanguard card for a player.
 * @param {number} playerId Target player id.
 * @param {ScryfallEmblemCard | null} vanguard Selected Vanguard, or `null` to clear.
 * @returns {void}
 */
export const setPlayerVanguard = (playerId: number, vanguard: ScryfallEmblemCard | null) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					vanguard
				};
			}
			return player;
		});
	});
};

/**
 * Stores draft options shown to the player in Vanguard draft-three mode.
 * @param {number} playerId Target player id.
 * @param {ScryfallEmblemCard[]} choices Candidate Vanguard cards.
 * @returns {void}
 */
export const setPlayerVanguardChoices = (playerId: number, choices: ScryfallEmblemCard[]) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					vanguardChoices: choices
				};
			}
			return player;
		});
	});
};

export const setPlayerTreacheryCard = (
	playerId: number,
	role: TreacheryRole | null,
	card: TreacheryCard | null
) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					treacheryRole: role,
					treacheryCard: card
				};
			}
			return player;
		});
	});
};

/**
 * Marks whether a player's Treachery role/card has been revealed to them.
 * @param {number} playerId Target player id.
 * @param {boolean} seen Reveal state.
 * @returns {void}
 */
export const setPlayerTreacherySeen = (playerId: number, seen: boolean) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					treacherySeen: seen
				};
			}
			return player;
		});
	});
};

const shuffleCards = <T>(array: T[]) => {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};

/**
 * Assigns random Vanguard cards for every active player according to settings.
 * Supports single-pick mode and draft-three mode.
 * @returns {Promise<void>}
 */
export const assignRandomVanguardsForGame = async () => {
	const settings = get(appSettings);
	const totalPlayers = settings.playerCount || 4;
	if (!settings.vanguardModeEnabled || totalPlayers <= 0) {
		players.update((currentPlayers) =>
			currentPlayers.map((player) => ({
				...player,
				vanguard: null,
				vanguardChoices: []
			}))
		);
		return;
	}

	const choicesPerPlayer = settings.vanguardDraftThree ? 3 : 1;
	const needed = totalPlayers * choicesPerPlayer;
	const pool = await searchVanguardCards('', Math.max(needed + 20, 80));
	if (!pool.length) return;

	const shuffled = shuffleCards(pool);
	if (shuffled.length < needed) return;

	const selectedByPlayer: Record<
		number,
		{ selected: ScryfallEmblemCard | null; choices: ScryfallEmblemCard[] }
	> = {};

	for (let playerIndex = 0; playerIndex < totalPlayers; playerIndex++) {
		const start = playerIndex * choicesPerPlayer;
		const choices = shuffled.slice(start, start + choicesPerPlayer);
		const selected =
			choices.length > 0 ? choices[Math.floor(Math.random() * choices.length)] : null;
		selectedByPlayer[playerIndex + 1] = { selected, choices };
	}

	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id > totalPlayers) {
				return {
					...player,
					vanguard: null,
					vanguardChoices: []
				};
			}

			const assignment = selectedByPlayer[player.id];
			if (!assignment) return player;

			return {
				...player,
				vanguard: assignment.selected,
				vanguardChoices: assignment.choices
			};
		});
	});
};

/**
 * Assigns Treachery roles (and cards when not in Shogun variant) to active players.
 * Clears assignments when mode is disabled or player count is unsupported.
 * @returns {Promise<void>}
 */
export const assignRandomTreacheryForGame = async () => {
	const settings = get(appSettings);
	const totalPlayers = settings.playerCount || 4;
	const roleCounts = getRequiredTreacheryRoleCounts(totalPlayers);
	const isShogunVariant = !!settings.shogunVariantEnabled;

	if (!settings.treacheryModeEnabled || totalPlayers <= 0 || !roleCounts) {
		players.update((currentPlayers) =>
			currentPlayers.map((player) => ({
				...player,
				treacheryRole: null,
				treacheryCard: null,
				treacherySeen: false
			}))
		);
		return;
	}

	const rolePool: TreacheryRole[] = [
		...Array(roleCounts.leader).fill('leader'),
		...Array(roleCounts.guardian).fill('guardian'),
		...Array(roleCounts.assassin).fill('assassin'),
		...Array(roleCounts.traitor).fill('traitor')
	] as TreacheryRole[];

	const shuffledRoles = shuffleCards(rolePool);

	if (isShogunVariant) {
		players.update((currentPlayers) => {
			return currentPlayers.map((player) => {
				if (player.id > totalPlayers) {
					return {
						...player,
						treacheryRole: null,
						treacheryCard: null,
						treacherySeen: false
					};
				}

				const role = shuffledRoles[player.id - 1] ?? null;
				return {
					...player,
					treacheryRole: role,
					treacheryCard: null,
					treacherySeen: false
				};
			});
		});
		return;
	}

	const catalog = await loadTreacheryCatalog();
	if (!catalog.length) return;

	const byRole: Record<TreacheryRole, TreacheryCatalogEntry[]> = {
		leader: shuffleCards(catalog.filter((entry) => entry.role === 'leader')),
		guardian: shuffleCards(catalog.filter((entry) => entry.role === 'guardian')),
		assassin: shuffleCards(catalog.filter((entry) => entry.role === 'assassin')),
		traitor: shuffleCards(catalog.filter((entry) => entry.role === 'traitor'))
	};
	const assignments: { playerId: number; role: TreacheryRole; entry: TreacheryCatalogEntry }[] = [];

	for (let playerIndex = 0; playerIndex < totalPlayers; playerIndex++) {
		const playerId = playerIndex + 1;
		const role = shuffledRoles[playerIndex];
		if (!role) continue;
		const nextCard = byRole[role].pop();
		if (!nextCard) continue;
		assignments.push({ playerId, role, entry: nextCard });
	}

	const detailList = await Promise.all(
		assignments.map(async (assignment) => {
			const card = await fetchTreacheryCardBySlug(assignment.entry);
			return {
				playerId: assignment.playerId,
				role: assignment.role,
				card
			};
		})
	);

	const byPlayerId = new Map(detailList.map((entry) => [entry.playerId, entry]));

	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id > totalPlayers) {
				return {
					...player,
					treacheryRole: null,
					treacheryCard: null,
					treacherySeen: false
				};
			}

			const assignment = byPlayerId.get(player.id);
			if (!assignment) {
				return {
					...player,
					treacheryRole: null,
					treacheryCard: null,
					treacherySeen: false
				};
			}

			return {
				...player,
				treacheryRole: assignment.role,
				treacheryCard: assignment.card,
				treacherySeen: false
			};
		});
	});
};

export const setPlayerBackgroundImage = (
	playerId: number,
	imageUrlOrPayload:
		| string
		| string[]
		| null
		| { imageUrl: string | null; artist?: string | null; set_name?: string | null }
) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				let image: string | string[] | null = null;
				let artist: string | null = null;
				let set_name: string | null = null;

				if (Array.isArray(imageUrlOrPayload)) {
					image = imageUrlOrPayload;
				} else if (typeof imageUrlOrPayload === 'string' || imageUrlOrPayload === null) {
					image = imageUrlOrPayload;
				} else {
					// payload object
					image = imageUrlOrPayload.imageUrl ?? null;
					artist = imageUrlOrPayload.artist ?? null;
					set_name = imageUrlOrPayload.set_name ?? null;
				}

				return {
					...player,
					backgroundImage: image,
					backgroundArtist: artist,
					backgroundSet: set_name
				};
			}
			return player;
		});
	});
};

/**
 * Updates a boolean status flag (monarch, initiative, ko, dayNight, ...).
 * Enforces uniqueness for selected statuses and writes history when value changes.
 * @param {number} playerId Target player id.
 * @param {string} key Status key.
 * @param {boolean} value New flag value.
 * @returns {void}
 */
export const setPlayerStatusBoolean = (playerId: number, key: string, value: boolean) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	const previous = !!targetBefore?.statusEffects?.[key];
	if (key === 'commandTax') {
		setPlayerCommandTax(playerId, value, 0, mergeKey);
		return;
	}
	const snapshot = getPlayerSnapshot(playerId);

	updatePlayersAndPlayEliminationSounds((currentPlayers) => {
		if (key === 'dayNight') {
			return currentPlayers.map((player) => {
				const statusEffects = player.statusEffects ? { ...player.statusEffects } : {};
				// @ts-ignore
				statusEffects.dayNight = value;
				return {
					...player,
					statusEffects
				};
			});
		}

		// If setting a unique status (monarch/initiative) to true,
		// remove it from all other players so only one has it.
		const uniqueKeys = ['monarch', 'initiative'];

		return currentPlayers.map((player) => {
			const statusEffects = player.statusEffects ? { ...player.statusEffects } : {};

			if (player.id === playerId) {
				// set the requested value for the target player
				// @ts-ignore
				statusEffects[key] = value;
				// If toggling K.O., keep the isDead flag in sync
				if (key === 'ko') {
					return {
						...player,
						statusEffects,
						isDead: !!value
					};
				}
				return {
					...player,
					statusEffects
				};
			}

			// if we're enabling a unique key, ensure others don't have it
			if (value === true && uniqueKeys.indexOf(key) !== -1) {
				// @ts-ignore
				if (statusEffects[key]) {
					// @ts-ignore
					statusEffects[key] = false;
					return {
						...player,
						statusEffects
					};
				}
			}

			return player;
		});
	});

	if (key === 'dayNight') {
		setDayNightCycleEnabled(value);
	}

	if (snapshot && previous !== value) {
		addGameHistoryEntry({
			playerId: snapshot.id,
			playerName: snapshot.playerName,
			kind: 'statusBoolean',
			payload: {
				key,
				from: previous,
				to: value
			}
		});
	}
};

/**
 * Clears day/night marker from all players and disables global Day/Night tracking.
 * @returns {void}
 */
export const clearDayNightStatus = () => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (!player.statusEffects?.dayNight) {
				return player;
			}
			return {
				...player,
				statusEffects: {
					...player.statusEffects,
					dayNight: false
				}
			};
		});
	});

	setDayNightCycleEnabled(false);
};

export const setPlayerStatusNumeric = (
	playerId: number,
	key: string,
	value: number,
	mergeKey?: string
) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	const previous = Number(targetBefore?.statusEffects?.[key] ?? 0);
	const snapshot = getPlayerSnapshot(playerId);
	const mergeableNumericStatuses = new Set(['energy', 'experience', 'rad', 'acorn', 'ticket']);
	const autoMergeKey =
		mergeKey ??
		(mergeableNumericStatuses.has(key) && Math.abs(value - previous) === 1
			? `status:${playerId}:${key}:${value > previous ? 'add' : 'subtract'}`
			: undefined);

	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				const statusEffects = player.statusEffects ? { ...player.statusEffects } : {};
				// @ts-ignore
				statusEffects[key] = value;
				return {
					...player,
					statusEffects
				};
			}
			return player;
		});
	});

	if (snapshot && previous !== value) {
		addGameHistoryEntry({
			playerId: snapshot.id,
			playerName: snapshot.playerName,
			kind: 'statusNumeric',
			mergeKey: autoMergeKey,
			payload: {
				key,
				from: previous,
				to: value
			}
		});
	}
};

/**
 * Toggles temporary highlight state used by seat selection/spin animations.
 * @param {number} playerId Target player id.
 * @param {boolean} highlighted Highlight state.
 * @returns {void}
 */
export const setPlayerHighlighted = (playerId: number, highlighted: boolean) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					highlighted
				};
			}
			return player;
		});
	});
};

/**
 * Sets poison counters for a player and records the update in game history.
 * @param {number} playerId Target player id.
 * @param {number} amount Absolute poison counter value.
 * @param {string} [mergeKey] Optional history merge key.
 * @returns {void}
 */
export const setPlayerPoison = (playerId: number, amount: number, mergeKey?: string) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	const previous = Number(targetBefore?.poison ?? 0);
	const snapshot = getPlayerSnapshot(playerId);
	const autoMergeKey =
		mergeKey ??
		(Math.abs(amount - previous) === 1
			? `poison:${playerId}:${amount > previous ? 'add' : 'subtract'}`
			: undefined);

	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					poison: amount
				};
			}
			return player;
		});
	});

	if (snapshot && previous !== amount) {
		addGameHistoryEntry({
			playerId: snapshot.id,
			playerName: snapshot.playerName,
			kind: 'poison',
			mergeKey: autoMergeKey,
			payload: {
				from: previous,
				to: amount
			}
		});
	}
};

export const setCommanderDamage = (
	playerId: number,
	fromPlayerId: number,
	amount: number,
	sourceIndex = 0,
	options?: {
		playSound?: boolean;
	}
) => {
	// Commander damage editing tracks commander counters only.
	// It must not directly modify life totals.
	const currentPlayers = get(players);
	const target = currentPlayers.find((p) => p.id === playerId);
	if (!target) return;
	const sourceSlot = sourceIndex === 1 ? 1 : 0;

	const snapshot = {
		id: target.id,
		playerName: target.playerName
	};
	const oldCommanderDamage = getCommanderDamageSourceValue(target, fromPlayerId, sourceSlot);
	const sourcePlayerName = currentPlayers.find((player) => player.id === fromPlayerId)?.playerName;
	const newAmount = clampCommanderDamageAmount(amount);
	const delta = newAmount - oldCommanderDamage;
	if (delta === 0) return;

	updatePlayersAndPlayEliminationSounds((existingPlayers) => {
		return existingPlayers.map((player) => {
			if (player.id !== playerId) return player;

			const playerSlots = Math.max(2, Math.min(8, existingPlayers.length));
			const commanderDamageBySource = getCommanderDamageBySourceForPlayer(player, playerSlots).map(
				(pair) => pair.slice(0, COMMANDER_DAMAGE_SOURCE_SLOTS)
			);
			commanderDamageBySource[fromPlayerId - 1][sourceSlot] = newAmount;
			const commanderDamage = commanderDamageBySource.map((pair) => pair[0] + pair[1]);

			return {
				...player,
				statusEffects: {
					...player.statusEffects,
					commanderDamage,
					commanderDamageBySource
				}
			};
		});
	});

	if (Math.abs(delta) > 0 && options?.playSound !== false) {
		playGameplaySound(delta > 0 ? 'bigCommanderDown' : 'bigCommanderUp');
	}

	addGameHistoryEntry({
		playerId: snapshot.id,
		playerName: snapshot.playerName,
		kind: 'commanderDamage',
		payload: {
			fromPlayerId,
			fromPlayerName: sourcePlayerName,
			sourceIndex: sourceSlot + 1,
			from: oldCommanderDamage,
			to: newAmount
		}
	});

	recordSnapshot(get(players));
};

/**
 * Extracts image/artist/set metadata from raw Scryfall card payload.
 * @param {any} data Raw Scryfall card object.
 * @returns {{ imageUrl: string; artist: string | null; set_name: string | null } | null} Normalized background payload.
 */
const extractScryfallImagePayload = (data: any) => {
	// try common image locations
	let imageUrl: string | null = null;
	if (data.image_uris && data.image_uris.art_crop) {
		imageUrl = data.image_uris.art_crop;
	} else if (data.image_uris && data.image_uris.large) {
		imageUrl = data.image_uris.large;
	} else if (data.image_uris && data.image_uris.normal) {
		imageUrl = data.image_uris.normal;
	} else if (data.card_faces && data.card_faces[0] && data.card_faces[0].image_uris) {
		imageUrl =
			data.card_faces[0].image_uris.art_crop ||
			data.card_faces[0].image_uris.large ||
			data.card_faces[0].image_uris.normal ||
			null;
	}

	const artist =
		data.artist ??
		(data.card_faces && data.card_faces[0] && data.card_faces[0].artist_name) ??
		null;
	const set_name = data.set_name ?? null;

	if (!imageUrl) return null;

	return { imageUrl, artist, set_name };
};

// Try to fetch a random card image from Scryfall matching a given name.
// Returns a payload compatible with `setPlayerBackgroundImage` helper or null on failure.
/**
 * Searches Scryfall random endpoint for a thematic background matching player name.
 * Tries several fallback queries centered on commanders/planeswalkers.
 * @param {string} name Player name used as search hint.
 * @returns {Promise<{ imageUrl: string; artist: string | null; set_name: string | null } | null>} Background payload or `null`.
 */
const fetchScryfallImageForName = async (name: string) => {
	if (typeof window === 'undefined' || !name) return null;

	const queries = [
		`type:planeswalker ${name}`,
		`is:commander ${name}`,
		`${name} (type:planeswalker or is:commander)`,
		`type:planeswalker`,
		`(is:commander or type:planeswalker)`
	];

	try {
		for (const query of queries) {
			const q = encodeURIComponent(query);
			const url = `https://api.scryfall.com/cards/random?q=${q}`;
			for (let attempt = 0; attempt < 2; attempt++) {
				const res = await fetch(url);
				if (!res.ok) {
					continue;
				}
				const data = await res.json();
				const payload = extractScryfallImagePayload(data);
				if (payload && payload.imageUrl) {
					return payload;
				}
			}
		}

		return null;
	} catch (e) {
		// network or parsing failure, ignore and continue
		return null;
	}
};

// If no saved players existed and we're in the browser, attempt to populate
// a thematic background image for each randomly-generated player name.
if (typeof window !== 'undefined') {
	try {
		// const raw = localStorage.getItem('players');
		const raw = undefined;
		if (!raw) {
			// run async initialisation without blocking module load
			(async () => {
				const current = get(players);
				for (const p of current) {
					if (!p.backgroundImage && p.playerName) {
						const payload = await fetchScryfallImageForName(p.playerName);
						if (payload && payload.imageUrl) {
							setPlayerBackgroundImage(p.id, payload);
						}
					}
				}
			})();
		}
	} catch (e) {
		// ignore
	}
}

// Object to store timeout references for each player
const resetTimers: { [key: number]: ReturnType<typeof setTimeout> } = {};

/**
 * Resets game state for a new match (life, statuses, timers, history, optional profile reset/seat shuffle).
 * Can prompt user for extra options before applying the reset.
 * @param {boolean} alreadyConfirmed Skip confirmation modal when `true`.
 * @returns {Promise<void>}
 */
export const resetLifeTotals = async (alreadyConfirmed: boolean) => {
	let resetProfiles = false;
	let randomizeSeats = false;
	let clearProfiles = false;
	// For 2-player mode: 0 = Player 1 starts, 1 = Player 2 starts, 2 = Random
	let startingPlayerChoice: number = 2;
	const playerCount = get(appSettings).playerCount;
	const isTwoPlayerMode = playerCount === 2;

	if (!alreadyConfirmed) {
		const confirmOptions: {
			checkboxLabel: string[];
			checkboxDefaultValue: boolean[];
			radioGroupLabel?: string;
			radioOptions?: string[];
			radioDefaultValue?: number;
		} = {
			checkboxLabel: [
				get(_)('reset_player_profiles_checkbox') || 'Also reset player profiles (colors)',
				get(_)('reset_player_profiles_checkbox_plus_randomize_seats') ||
					'Also randomize player seats?',
				get(_)('reset_player_profiles_checkbox_plus_clear_profile') ||
					'Also clear player profiles (name and background)?'
			],
			checkboxDefaultValue: [false, false, false]
		};

		if (isTwoPlayerMode) {
			const currentPlayers = get(players);
			const player1Name =
				currentPlayers[0]?.playerName || (get(_)('player') ? `${get(_)('player')} 1` : 'Player 1');
			const player2Name =
				currentPlayers[1]?.playerName || (get(_)('player') ? `${get(_)('player')} 2` : 'Player 2');
			confirmOptions.radioGroupLabel = get(_)('reset_game_who_starts') || 'Who should start?';
			confirmOptions.radioOptions = [
				(get(_)('reset_game_player1_starts') || '{player} starts').replace('{player}', player1Name),
				(get(_)('reset_game_player2_starts') || '{player} starts').replace('{player}', player2Name),
				get(_)('reset_game_random_start') || 'Random'
			];
			confirmOptions.radioDefaultValue = 2;
		}

		const result = await showConfirm(
			get(_)('window_confirm_reset_game') || 'Are you sure you want to continue?',
			confirmOptions
		);

		if (typeof result === 'boolean') {
			// Backwards compatibility: if result is just a boolean, use it as confirmation
			if (!result) {
				return;
			}
		} else {
			// New behavior: result is an object with confirmed and checkboxValue
			if (!result.confirmed) {
				return;
			}
			if (Array.isArray(result.checkboxValue) && result.checkboxValue.length >= 1) {
				resetProfiles = result.checkboxValue[0] || false;
			}
			if (Array.isArray(result.checkboxValue) && result.checkboxValue.length >= 2) {
				randomizeSeats = result.checkboxValue[1] || false;
			}
			if (Array.isArray(result.checkboxValue) && result.checkboxValue.length >= 3) {
				clearProfiles = result.checkboxValue[2] || false;
			}
			if (typeof result.checkboxValue === 'boolean') {
				// Backwards compatibility: if checkboxValue is just a boolean, use it to decide whether to reset profiles
				resetProfiles = result.checkboxValue ?? false;
			}
			if (isTwoPlayerMode && typeof result.radioValue === 'number') {
				startingPlayerChoice = result.radioValue;
			}
		}
	}

	const startingLifeTotal = get(appSettings).startingLifeTotal;
	const shouldKeepGlobalTimerRunning =
		isTwoPlayerMode && get(appSettings).globalGameTimerEnabled && startingPlayerChoice !== 2;
	removeFirstPlace();
	resetResources();
	clearGameHistory();
	clearLifeHistory();
	addGameHistoryEntry({
		playerId: 0,
		playerName: '',
		kind: 'gameRestart',
		payload: {}
	});

	// reset current turn and turn count
	setCurrentTurn(0, false);
	if (!shouldKeepGlobalTimerRunning) {
		globalGameTimer.resetForNewGame();
	}
	appState.update((data) => ({
		...data,
		currentTurn: -1,
		turnCount: 0,
		startingPlayerIndex: null
	}));
	vibrate(30);

	// reset the lifeChangeHistoryResetKey to trigger any dependent components to reset their history
	lifeChangeHistoryResetKey.update((value) => value + 1);

	// Reset life totals and optionally profiles for all players
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			// Clear any existing timer for this player
			if (resetTimers[player.id]) {
				clearTimeout(resetTimers[player.id]);
				delete resetTimers[player.id]; // Remove the timer reference
			}

			const updatedPlayer = {
				...player,
				lifeTotal: startingLifeTotal,
				tempLifeDiff: 0, // Reset tempLifeDiff to 0
				poison: 0,
				vanguard: null,
				vanguardChoices: [],
				treacheryRole: null,
				treacheryCard: null,
				treacherySeen: false,
				statusEffects: {
					commanderDamage: [], // Reset commander damage totals (legacy compatibility)
					commanderDamageBySource: [], // Reset partner commander damage sources
					partnerMode: false
				}
			};

			// If resetProfiles is enabled, reset color and backgroundImage to defaults
			if (resetProfiles) {
				// The .color is randomly chosen among two lists of options as when generating default players
				const first_choices = ['white', 'blue', 'black', 'red', 'green'];
				const second_choices = [
					'mud',
					'metalicgray',
					'gold',
					'purple',
					'pink',
					'orange',
					'lightgreen'
				];
				const color = `${first_choices[Math.floor(Math.random() * first_choices.length)]},${second_choices[Math.floor(Math.random() * second_choices.length)]}`;

				updatedPlayer.color = color;
				updatedPlayer.backgroundImage = null;
			}

			// If clearProfiles is enabled, reset color to white and backgroundImage to null, regardless of resetProfiles value
			if (clearProfiles) {
				updatedPlayer.color = 'white';
				updatedPlayer.backgroundImage = null;
				updatedPlayer.playerName = get(_)('player')
					? `${get(_)('player')} ${player.id}`
					: `Player ${player.id}`;
			}

			return updatedPlayer;
		});
	});

	// Shuffle the array of players, if randomizeSeats is enabled
	if (randomizeSeats) {
		players.update((currentPlayers) => {
			// only shuffle the active players, keep the useless slots at the end of the list
			const activeCount = get(appSettings).playerCount || 4;
			const activePlayers = currentPlayers.slice(0, activeCount);
			const inactivePlayers = currentPlayers.slice(activeCount);
			return [...shuffle(activePlayers), ...inactivePlayers];
		});
		// Seat-based components and handlers use 1-based player ids.
		// After shuffling, reassign ids to match the new seat positions.
		players.update((currentPlayers) => {
			return currentPlayers.map((player, index) => {
				return {
					...player,
					id: index + 1
				};
			});
		});
	}

	await assignRandomVanguardsForGame();
	await assignRandomTreacheryForGame();

	if (isTwoPlayerMode && startingPlayerChoice !== 2) {
		// Directly set the chosen player as the starting player (no spin animation)
		setFirstPlayer(startingPlayerChoice);
	} else {
		spinToSelectFirstPlayer();
	}

	recordImmediateSnapshot(get(players));
};

/**
 * Mélange un tableau de manière efficace et impartiale.
 * @param {Array} array - Le tableau à mélanger (modifié en place).
 */
function shuffle(array: any[]) {
	for (let i = array.length - 1; i > 0; i--) {
		// Choisir un index aléatoire entre 0 et i (inclus)
		const j = Math.floor(Math.random() * (i + 1));
		// Échange des éléments via la déstructuration ES6
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

/**
 * Applies a relative life delta to a player and records it in history.
 * @param {number} playerId Target player id.
 * @param {number} amount Signed delta to add to current life total.
 * @returns {void}
 */
export const setPlayerLifeTotal = (playerId: number, amount: number) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	if (!targetBefore) return;
	const oldLifeTotal = targetBefore.lifeTotal;
	const snapshot = {
		id: targetBefore.id,
		playerName: targetBefore.playerName
	};

	updatePlayersAndPlayEliminationSounds((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					lifeTotal: player.lifeTotal + amount
				};
			}
			return player;
		});
	});

	if (amount !== 0) {
		addGameHistoryEntry({
			playerId: snapshot.id,
			playerName: snapshot.playerName,
			kind: amount > 0 ? 'positiveLife' : 'negativeLife',
			payload: {
				from: oldLifeTotal,
				to: oldLifeTotal + amount
			}
		});
		recordSnapshot(get(players));
	}
};

// Set the player's life total to an absolute value (clamped according to settings)
/**
 * Sets absolute life total for one player, clamped by game rules.
 * Also computes a temporary visual delta and records history entry when value changes.
 * @param {number} playerId Target player id.
 * @param {number} value Desired absolute life total.
 * @returns {void}
 */
export const setPlayerLifeAbsolute = (playerId: number, value: number) => {
	const currentPlayers = get(players);
	const player = currentPlayers.find((p) => p.id === playerId);
	if (!player) return;

	const minAllowed = canUseNegativeLife(player, Math.trunc(value)) ? -999 : 0;

	const newLifeTotal = Math.max(minAllowed, Math.min(999, Math.trunc(value)));
	const diff = newLifeTotal - player.lifeTotal;
	const snapshot = {
		id: player.id,
		playerName: player.playerName
	};

	// Update the life total
	updatePlayersAndPlayEliminationSounds((currentPlayers) => {
		return currentPlayers.map((p) => {
			if (p.id === playerId) {
				return {
					...p,
					lifeTotal: newLifeTotal
				};
			}
			return p;
		});
	});

	// Show a temporary diff indicator similar to incremental changes
	if (diff !== 0) {
		addGameHistoryEntry({
			playerId: snapshot.id,
			playerName: snapshot.playerName,
			kind: diff > 0 ? 'positiveLife' : 'negativeLife',
			payload: {
				from: player.lifeTotal,
				to: newLifeTotal
			}
		});

		if (diff > 0) {
			setTempLifeDiff(playerId, 'add', Math.abs(diff));
		} else {
			setTempLifeDiff(playerId, 'subtract', Math.abs(diff));
		}

		recordSnapshot(get(players));
	}
};

type LifeBurstState = {
	count: number;
	timer: ReturnType<typeof setTimeout> | null;
};

const LIFE_BURST_DEBOUNCE_MS = 650;
const lifeBurstMap = new Map<string, LifeBurstState>();

const flushLifeBurst = (key: string, lifeType: App.Player.LifeMoveType) => {
	const burst = lifeBurstMap.get(key);
	if (!burst) return;
	if (burst.timer) {
		clearTimeout(burst.timer);
	}
	lifeBurstMap.delete(key);

	if (burst.count <= 0) return;
	playLifeTapBurstSound(burst.count, lifeType === 'subtract' ? 'damage' : 'heal');
};

const queueLifeBurst = (playerId: number, lifeType: App.Player.LifeMoveType, increment: number) => {
	const key = `${playerId}:${lifeType}`;
	const existing = lifeBurstMap.get(key);
	const nextCount = (existing?.count ?? 0) + increment;
	if (existing?.timer) {
		clearTimeout(existing.timer);
	}
	const timer = setTimeout(() => {
		flushLifeBurst(key, lifeType);
	}, LIFE_BURST_DEBOUNCE_MS);
	lifeBurstMap.set(key, {
		count: nextCount,
		timer
	});
};

export const manageLifeTotal = (
	type: App.Player.LifeMoveType,
	playerId: number,
	amount: number = 1
) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	if (!targetBefore) return;

	// removeFirstPlace();
	let withinBounds = false; // Flag to determine if setTempLifeDiff should be called
	if (amount <= 1) {
		vibrate(10);
	} else {
		vibrate(40);
	}

	updatePlayersAndPlayEliminationSounds((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				let newLifeTotal = player.lifeTotal;

				if (type === 'add') {
					newLifeTotal += amount;
					withinBounds = newLifeTotal <= 9999; // Check if within bounds
				} else if (type === 'subtract') {
					newLifeTotal -= amount;
					withinBounds = newLifeTotal >= -9999; // Check if within bounds
				}

				// Ensure the life total is within acceptable bounds
				// allow negative life totals when enabled globally or per-player
				const minAllowed = canUseNegativeLife(player, newLifeTotal) ? -9999 : 0;
				newLifeTotal = Math.max(minAllowed, Math.min(9999, newLifeTotal));

				return {
					...player,
					lifeTotal: newLifeTotal
				};
			}
			return player;
		});
	});

	// Only run this if life total is within bounds
	// recompute withinBounds according to allowed min when needed
	if (withinBounds) {
		setTempLifeDiff(playerId, type, amount);
	}

	const targetAfter = get(players).find((player) => player.id === playerId);
	if (targetAfter && targetAfter.lifeTotal !== targetBefore.lifeTotal) {
		if (amount > 5) {
			playLifeLongStepSound(type === 'subtract' ? 'damage' : 'heal');
		} else if (amount === 1) {
			queueLifeBurst(playerId, type, 1);
		}

		addGameHistoryEntry({
			playerId: targetAfter.id,
			playerName: targetAfter.playerName,
			kind: type === 'add' ? 'positiveLife' : 'negativeLife',
			mergeKey: `life:${targetAfter.id}:${type}`,
			payload: {
				from: targetBefore.lifeTotal,
				to: targetAfter.lifeTotal
			}
		});
		recordSnapshot(get(players));
	}
};

/**
 * Updates displayed player name.
 * @param {number} playerId Target player id.
 * @param {string} playerName New player name.
 * @returns {void}
 */
export const setPlayerName = (playerId: number, playerName: string) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				return {
					...player,
					playerName: playerName
				};
			}
			return player;
		});
	});
};

/**
 * Rewrites player ids to remain 1-based seat indexes after reorder/swap operations.
 * @param {App.Player.Data[]} list Player array in visual seat order.
 * @returns {App.Player.Data[]} Same list with normalized seat ids.
 */
const normalizeSeatIds = (list: App.Player.Data[]) => {
	return list.map((player, index) => ({
		...player,
		id: index + 1
	}));
};

// Swap exactly two player seats (0-based indices).
// This keeps seat-based ids consistent with visual positions.
/**
 * Swaps two active seats by index and renormalizes player ids.
 * @param {number} fromIndex Source seat index (0-based).
 * @param {number} toIndex Target seat index (0-based).
 * @returns {void}
 */
export const swapPlayersSeats = (fromIndex: number, toIndex: number) => {
	players.update((currentPlayers) => {
		const n = currentPlayers.length;
		const activeCount = get(appSettings).playerCount || n;
		if (fromIndex < 0 || toIndex < 0 || fromIndex >= activeCount || toIndex >= activeCount) {
			return currentPlayers;
		}
		if (fromIndex === toIndex) return currentPlayers;

		const newPlayers = currentPlayers.slice();
		[newPlayers[fromIndex], newPlayers[toIndex]] = [newPlayers[toIndex], newPlayers[fromIndex]];
		return normalizeSeatIds(newPlayers);
	});
};

// Reorder players array by moving element at fromIndex to toIndex (0-based indices)
/**
 * Reorders seats by delegating to swap behavior used by draggable UI.
 * @param {number} fromIndex Source seat index.
 * @param {number} toIndex Destination seat index.
 * @returns {void}
 */
export const reorderPlayers = (fromIndex: number, toIndex: number) => {
	swapPlayersSeats(fromIndex, toIndex);
};

export const setTempLifeDiff = (
	playerId: number,
	type: App.Player.LifeMoveType,
	amount: number
) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				let tempLifeDiff = player.tempLifeDiff;
				if (type === 'add') {
					tempLifeDiff += amount;
				} else if (type === 'subtract') {
					tempLifeDiff -= amount;
				}

				if (resetTimers[playerId]) {
					clearTimeout(resetTimers[playerId]);
				}

				resetTimers[playerId] = setTimeout(() => {
					players.update((currentPlayers) => {
						return currentPlayers.map((p) => {
							if (p.id === playerId) {
								return {
									...p,
									tempLifeDiff: 0
								};
							}
							return p;
						});
					});
				}, 3000);

				return {
					...player,
					tempLifeDiff
				};
			}
			return player;
		});
	});
};

/**
 * Clears the `isFirst` flag for all players.
 * @returns {void}
 */
export const removeFirstPlace = () => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => ({
			...player,
			isFirst: false
		}));
	});
};

export const spinning = writable(false);

const pickRandomSeatIndex = (totalPlayers: number): number => {
	if (totalPlayers <= 0) return 0;
	const settings = get(appSettings);
	if (!settings.useWeightedStartingPlayer) {
		return Math.floor(Math.random() * totalPlayers);
	}
	return pickWeightedIndex(settings.startingPlayerProbabilities ?? [], totalPlayers);
};

/**
 * Marks one seat as starting player and aligns turn state accordingly.
 * @param {number} playerIndex Starting player seat index (0-based).
 * @returns {void}
 */
export const setFirstPlayer = (playerIndex: number) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player, index) => ({
			...player,
			isFirst: index === playerIndex,
			highlighted: false,
			isDead: false
		}));
	});
	setCurrentTurn(playerIndex, true, true);
};

/**
 * Runs animated seat-highlighting roulette and chooses the starting player.
 * Uses weighted probabilities when enabled in settings.
 * @returns {void}
 */
export const spinToSelectFirstPlayer = () => {
	const totalPlayers = get(appSettings).playerCount;
	if (totalPlayers === 0) return;
	const chosenIndex = pickRandomSeatIndex(totalPlayers);

	spinning.set(true);
	let currentIndex = 0;
	const extraRounds = Math.floor(Math.random() * 3) + 4;
	let spinCount = extraRounds * totalPlayers + chosenIndex + 1;
	let intervalTime = 25;
	const finalPauseTime = 100;

	/**
	 * Executes one animation step of the starting-player roulette.
	 * @returns {void}
	 */
	const spin = () => {
		players.update((currentPlayers) => {
			return currentPlayers.map((player, index) => {
				return {
					...player,
					highlighted: index === currentIndex % totalPlayers
				};
			});
		});

		currentIndex++;
		spinCount--;

		if (spinCount > 0) {
			intervalTime += 10;
			setTimeout(spin, intervalTime);
		} else {
			setTimeout(() => {
				spinning.set(false);
				players.update((currentPlayers) => {
					return currentPlayers.map((player, index) => {
						return {
							...player,
							isFirst: index === (currentIndex - 1) % totalPlayers,
							highlighted: false,
							isDead: false
						};
					});
				});
				// set the current turn to the selected starting player
				setCurrentTurn((currentIndex - 1 + totalPlayers) % totalPlayers, true, true);
			}, finalPauseTime);
		}
	};

	spin();
};

/**
 * Runs a short roulette animation and selects a random active player for modal display.
 * @returns {void}
 */
export const spinToSelectRandomPlayer = () => {
	const totalPlayers = get(appSettings).playerCount;
	if (totalPlayers === 0) return;
	const chosenIndex = pickRandomSeatIndex(totalPlayers);

	spinning.set(true);
	let currentIndex = 0;
	const extraRounds = Math.floor(Math.random() * 2) + 2;
	let spinCount = extraRounds * totalPlayers + chosenIndex + 1;
	let intervalTime = 10;
	const finalPauseTime = 100;

	/**
	 * Executes one animation step for random-player roulette.
	 * @returns {void}
	 */
	const spin = () => {
		players.update((currentPlayers) => {
			return currentPlayers.map((player, index) => {
				return {
					...player,
					highlighted: index === currentIndex % totalPlayers
				};
			});
		});

		currentIndex++;
		spinCount--;

		if (spinCount > 0) {
			intervalTime += 10;
			setTimeout(spin, intervalTime);
		} else {
			setTimeout(() => {
				spinning.set(false);
				players.update((currentPlayers) => {
					return currentPlayers.map((player, index) => {
						return {
							...player,
							highlighted: false
						};
					});
				});
				const chosenIndex = (currentIndex - 1) % totalPlayers;
				selectRandomPlayer(chosenIndex);
			}, finalPauseTime);
		}
	};

	return spin();
};
