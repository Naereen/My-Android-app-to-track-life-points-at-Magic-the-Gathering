import { get, writable, type Writable } from 'svelte/store';
import { appSettings } from './appSettings';
import { _ } from 'svelte-i18n'; // i18n language toggle
import { showConfirm, selectRandomPlayer } from '$lib/store/modal';
import { setCurrentTurn, appState } from './appState';
import { persist } from './persist';
import { vibrate } from '$lib/utils/haptics';
import { playGameplaySound } from '$lib/utils/gameplaySound';
import { addGameHistoryEntry, clearGameHistory } from './gameHistory';
import { searchVanguardCards, type ScryfallEmblemCard } from '$lib/utils/scryfall';
import {
	fetchTreacheryCardBySlug,
	getRequiredTreacheryRoleCounts,
	loadTreacheryCatalog,
	type TreacheryCard,
	type TreacheryCatalogEntry,
	type TreacheryRole
} from '$lib/utils/treachery';
// import { chooseRandom, doSearch } from '$lib/components/modals/playerDataModal/PlayerDataModal';

const playerBaseName = get(_)('player') || 'Player';

const generateRandomPlayerName = () => {
	// List of planeswalker names from Magic: The Gathering, to use as random player names. Source: https://mtg.wiki/Planeswalkers and https://yawgatog.com/resources/magic-rules/#R2053j
	const popularPlaneswalkerNames : Record<string, string[]> = {
		'A' : [
			'Ajani',
			'Aminatou',
			'Angrath',
			'Arlinn',
			'Ashiok',
		],
		'B': [
			'Bahamut',
			'Basri',
			'Bolas',
		],
		'C': [
			'Calix',
			'Chandra',
			'Comet',
		],
		'D': [
			'Dack',
			'Dakkon',
			'Daretti',
			'Davriel',
			'Dihada',
			'Domri',
			'Dovin',
		],
		'E': [
			'Ellywick',
			'Elminster',
			'Elspeth',
			'Estrid',
		],
		'F': [
			'Freyalise',
		],
		'G': [
			'Garruk',
			'Gideon',
			'Grist',
			'Guff',
		],
		'H': [
			'Huatli',
		],
		'J': [
			'Jace',
			'Jared',
			'Jaya',
			'Jeska',
		],
		'K': [
			'Kaito',
			'Karn',
			'Kasmina',
			'Kaya',
			'Kiora',
			'Koth',
		],
		'L': [
			'Liliana',
			'Lolth',
			'Lukka',
		],
		'M': [
			'Minsc',
			'Mordenkainen',
		],
		'N': [
			'Nahiri',
			'Narset',
			'Niko',
			'Nissa',
			'Nixilis',
		],
		'O': [
			'Oko',
		],
		'Q': [
			'Quintorius',
		],
		'R': [
			'Ral',
			'Rowan',
		],
		'S': [
			'Saheeli',
			'Samut',
			'Sarkhan',
			'Serra',
			'Sivitri',
			'Sorin',
			'Szat',
		],
		'T': [
			'Tamiyo',
			'Tasha',
			'Teferi',
			'Teyo',
			'Tezzeret',
			'Tibalt',
			'Tyvar',
		],
		'U': [
			'Ugin',
			'Urza',
		],
		'V': [
			'Venser',
			'Vivien',
			'Vraska',
			'Vronos',
		],
		'W': [
			'Will',
			'Windgrace',
			'Wrenn',
		],
		'X': [
			'Xenagos',
		],
		'Y': [
			'Yanggu',
			'Yanling',
		],
		'Z': [
			'Zariel',
		],
	};

	const allNames = Object.values(popularPlaneswalkerNames).flat();
	const randomName = allNames[Math.floor(Math.random() * allNames.length)];
	return `${randomName}`;
	// const randomNumber = Math.ceil(Math.random() * 100);
	// return `${randomName} #${randomNumber}`;
}

const defaultPlayers: App.Player.Data[] = [
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
	}
];

// Helper to decide initial players array.
const getInitialPlayers = (): App.Player.Data[] => {
	// If running in browser and no saved players exist, assign random colors
	if (typeof window !== 'undefined') {
		try {
			const raw = localStorage.getItem('players');
			if (!raw) {
				// choose between all the colors for backgrounds
				const first_choices = ['white', 'blue', 'black', 'red', 'green'];
				const second_choices = [ 'mud', 'metalicgray', 'gold', 'purple', 'pink', 'orange', 'lightgreen' ];
				return defaultPlayers.map((p) => ({
					...p,
					playerName: generateRandomPlayerName(),
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

const isEliminated = (player: App.Player.Data) => {
	const globalAllowNegative = get(appSettings).allowNegativeLife || false;
	const allowNegative = globalAllowNegative || !!player.allowNegativeLife;
	const maxCommanderDamage = Math.max(0, ...(player.statusEffects?.commanderDamage ?? []));
	return (!allowNegative && player.lifeTotal <= 0) || player.statusEffects?.ko === true || maxCommanderDamage >= 21;
};

const alivePlayersCount = (list: App.Player.Data[]) => {
	const count = get(appSettings).playerCount;
	return list.slice(0, count).filter((player) => !isEliminated(player)).length;
};

const playEliminationSoundsIfNeeded = (beforePlayers: App.Player.Data[], afterPlayers: App.Player.Data[]) => {
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

const getPlayerSnapshot = (playerId: number) => {
	const target = get(players).find((player) => player.id === playerId);
	if (!target) return null;
	return {
		id: target.id,
		playerName: target.playerName
	};
};

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

export const setPlayerTreacheryCard = (playerId: number, role: TreacheryRole | null, card: TreacheryCard | null) => {
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

	const selectedByPlayer: Record<number, { selected: ScryfallEmblemCard | null; choices: ScryfallEmblemCard[] }> = {};

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

export const setPlayerStatusBoolean = (playerId: number, key: string, value: boolean) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	const previous = !!targetBefore?.statusEffects?.[key];
	const snapshot = getPlayerSnapshot(playerId);

	updatePlayersAndPlayEliminationSounds((currentPlayers) => {
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

export const setPlayerStatusNumeric = (playerId: number, key: string, value: number) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	const previous = Number(targetBefore?.statusEffects?.[key] ?? 0);
	const snapshot = getPlayerSnapshot(playerId);

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
			payload: {
				key,
				from: previous,
				to: value
			}
		});
	}
};

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

export const setPlayerPoison = (playerId: number, amount: number) => {
	const beforePlayers = get(players);
	const targetBefore = beforePlayers.find((player) => player.id === playerId);
	const previous = Number(targetBefore?.poison ?? 0);
	const snapshot = getPlayerSnapshot(playerId);

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
			payload: {
				from: previous,
				to: amount
			}
		});
	}
};

export const setCommanderDamage = (playerId: number, fromPlayerId: number, amount: number) => {
	// Read old value to compute delta so we can adjust life total accordingly
	const currentPlayers = get(players);
	const target = currentPlayers.find((p) => p.id === playerId);
	if (!target) return;

	const snapshot = {
		id: target.id,
		playerName: target.playerName
	};
	const oldCommanderDamage = (target?.statusEffects?.commanderDamage ?? [])[fromPlayerId - 1] ?? 0;
	const newAmount = Math.max(0, Math.min(999, amount));
	const delta = newAmount - oldCommanderDamage;
	if (delta === 0) return;
	const oldLifeTotal = target.lifeTotal;

	updatePlayersAndPlayEliminationSounds((existingPlayers) => {
		return existingPlayers.map((player) => {
			if (player.id !== playerId) return player;

			const commanderDamage = [...(player.statusEffects?.commanderDamage ?? [])];
			while (commanderDamage.length < fromPlayerId) {
				commanderDamage.push(0);
			}
			commanderDamage[fromPlayerId - 1] = newAmount;

			return {
				...player,
				lifeTotal: player.lifeTotal - delta,
				statusEffects: {
					...player.statusEffects,
					commanderDamage
				}
			};
		});
	});

	if (Math.abs(delta) > 0) {
		playGameplaySound(delta > 0 ? 'bigCommanderDown' : 'bigCommanderUp');
	}

	addGameHistoryEntry({
		playerId: snapshot.id,
		playerName: snapshot.playerName,
		kind: 'commanderDamage',
		payload: {
			fromPlayerId,
			from: oldCommanderDamage,
			to: newAmount,
			lifeDelta: -delta
		}
	});

	addGameHistoryEntry({
		playerId: snapshot.id,
		playerName: snapshot.playerName,
		kind: delta > 0 ? 'positiveLife' : 'negativeLife',
		payload: {
			from: oldLifeTotal,
			to: oldLifeTotal - delta
		}
	});
};

// Try to fetch a random card image from Scryfall matching a given name.
// Returns a payload compatible with `setPlayerBackgroundImage` helper or null on failure.
const fetchScryfallImageForName = async (name: string) => {
	if (typeof window === 'undefined' || !name) return null;

	try {
		// Use the random card endpoint with a query scoped to commanders and the provided name
		const q = encodeURIComponent(`is:commander ${name}`);
		const url = `https://api.scryfall.com/cards/random?q=${q}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		const data = await res.json();

		// try common image locations
		let imageUrl: string | null = null;
		if (data.image_uris && data.image_uris.art_crop) {
			imageUrl = data.image_uris.art_crop;
		} else if (data.image_uris && data.image_uris.large) {
			imageUrl = data.image_uris.large;
		} else if (data.image_uris && data.image_uris.normal) {
			imageUrl = data.image_uris.normal;
		} else if (data.card_faces && data.card_faces[0] && data.card_faces[0].image_uris) {
			imageUrl = data.card_faces[0].image_uris.art_crop || data.card_faces[0].image_uris.large || data.card_faces[0].image_uris.normal || null;
		}

		const artist = data.artist ?? (data.card_faces && data.card_faces[0] && data.card_faces[0].artist_name) ?? null;
		const set_name = data.set_name ?? null;

		if (!imageUrl) return null;

		return { imageUrl, artist, set_name };
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
const resetTimers: { [key: number]: number } = {};

export const resetLifeTotals = async (alreadyConfirmed: boolean) => {
	let resetProfiles = false;
	let randomizeSeats = false;
	let clearProfiles = false;

	if (!alreadyConfirmed) {
		const result = await showConfirm(
			get(_)('window_confirm_reset_game') || 'Are you sure you want to continue?',
			{
				checkboxLabel: [
					get(_)('reset_player_profiles_checkbox') || 'Also reset player profiles (colors)',
					get(_)('reset_player_profiles_checkbox_plus_randomize_seats') || 'Also reset player profiles (colors) + Randomize seats',
					get(_)('reset_player_profiles_checkbox_plus_clear_profile') || 'Also reset player profiles (colors) + Clear profile',
				],
				checkboxDefaultValue: [
					false,
					false,
					false,
				]
			}
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
		}
	}

	const startingLifeTotal = get(appSettings).startingLifeTotal;
	removeFirstPlace();
	clearGameHistory();

	// reset current turn and turn count
	setCurrentTurn(0, false);
	appState.update((data) => ({ ...data, currentTurn: -1, turnCount: 0, startingPlayerIndex: null }));
	vibrate(30);

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
					commanderDamage: [] // Reset commander damage
				}
			};

			// If resetProfiles is enabled, reset color and backgroundImage to defaults
			if (resetProfiles) {
				// The .color is randomly chosen among two lists of options as when generating default players
				const first_choices = ['white', 'blue', 'black', 'red', 'green'];
				const second_choices = [ 'mud', 'metalicgray', 'gold', 'purple', 'pink', 'orange', 'lightgreen' ];
				const color = `${first_choices[Math.floor(Math.random() * first_choices.length)]},${second_choices[Math.floor(Math.random() * second_choices.length)]}`;

				updatedPlayer.color = color;
				updatedPlayer.backgroundImage = null;
			}

			// If clearProfiles is enabled, reset color to white and backgroundImage to null, regardless of resetProfiles value
			if (clearProfiles) {
				updatedPlayer.color = 'white';
				updatedPlayer.backgroundImage = null;
				updatedPlayer.playerName = get(_)('player') ? `${get(_)('player')} ${1 + player.id}` : `Player ${1 + player.id}`;
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
		// Reset the player.id for each player?
		players.update((currentPlayers) => {
			return currentPlayers.map((player, index) => {
				player.id = index;
				return player;
			});
		});
	}

	await assignRandomVanguardsForGame();
	await assignRandomTreacheryForGame();

	spinToSelectFirstPlayer();
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
	}
};

// Set the player's life total to an absolute value (clamped according to settings)
export const setPlayerLifeAbsolute = (playerId: number, value: number) => {
	const currentPlayers = get(players);
	const player = currentPlayers.find((p) => p.id === playerId);
	if (!player) return;

	const globalAllow = get(appSettings).allowNegativeLife || false;
	const allowNegative = globalAllow || !!player.allowNegativeLife;
	const minAllowed = allowNegative ? -999 : 0;

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
	}
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
				const globalAllow = get(appSettings).allowNegativeLife || false;
				const allowNegative = globalAllow || !!player.allowNegativeLife;
				const minAllowed = allowNegative ? -9999 : 0;
				newLifeTotal = Math.max(minAllowed, Math.min(9999, newLifeTotal));

				return {
					...player,
					lifeTotal: newLifeTotal
				};
			}
			return player;
		});
	});

	if (amount > 5) {
		playGameplaySound(type === 'add' ? 'bigLifeUp' : 'bigLifeDown');
	}

	// Only run this if life total is within bounds
	// recompute withinBounds according to allowed min when needed
	if (withinBounds) {
		setTempLifeDiff(playerId, type, amount);
	}

	const targetAfter = get(players).find((player) => player.id === playerId);
	if (targetAfter && targetAfter.lifeTotal !== targetBefore.lifeTotal) {
		addGameHistoryEntry({
			playerId: targetAfter.id,
			playerName: targetAfter.playerName,
			kind: type === 'add' ? 'positiveLife' : 'negativeLife',
			payload: {
				from: targetBefore.lifeTotal,
				to: targetAfter.lifeTotal
			}
		});
	}
};

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

// Reorder players array by moving element at fromIndex to toIndex (0-based indices)
export const reorderPlayers = (fromIndex: number, toIndex: number) => {
	players.update((currentPlayers) => {
		//
		let targetIndex = (fromIndex < toIndex) ? toIndex - 1 : toIndex;
		//
		const n = currentPlayers.length;
		if (fromIndex < 0 || fromIndex >= n) return currentPlayers;
		if (fromIndex === toIndex) return currentPlayers;

		const newPlayers = currentPlayers.slice();
		const [item] = newPlayers.splice(fromIndex, 1);

		if (targetIndex < 0) targetIndex = 0;
		if (targetIndex >= n) targetIndex = n;
		newPlayers.splice(targetIndex, 0, item);
		return newPlayers;
	});
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

export const removeFirstPlace = () => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => ({
			...player,
			isFirst: false
		}));
	});
};

export const spinning = writable(false);

export const spinToSelectFirstPlayer = () => {
	const totalPlayers = get(appSettings).playerCount;
	if (totalPlayers === 0) return;

	spinning.set(true);
	let currentIndex = 0;
	let spinCount = Math.floor(Math.random() * 10) + totalPlayers * 4;
	let intervalTime = 25;
	const finalPauseTime = 100;

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
				setCurrentTurn((currentIndex - 1 + totalPlayers) % totalPlayers, true);
			}, finalPauseTime);
		}
	};

	spin();
};

export const spinToSelectRandomPlayer = () => {
	const totalPlayers = get(appSettings).playerCount;
	if (totalPlayers === 0) return;

	spinning.set(true);
	let currentIndex = 0;
	let spinCount = Math.floor(Math.random() * 10) + totalPlayers * 2;
	let intervalTime = 10;
	const finalPauseTime = 100;

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
							highlighted: false,
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
