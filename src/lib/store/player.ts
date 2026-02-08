import { get, writable, type Writable } from 'svelte/store';
import { appSettings } from './appSettings';
import { _ } from 'svelte-i18n'; // i18n language toggle
import { showConfirm, selectRandomPlayer } from '$lib/store/modal';
import { setCurrentTurn, appState } from './appState';
import { persist } from './persist';
import { vibrate } from '$lib/utils/haptics';
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
	const randomNumber = Math.ceil(Math.random() * 100);
	return `${randomName}`;
	// return `${randomName} #${randomNumber}`;
}

const defaultPlayers: App.Player.Data[] = [
	{
		id: 1,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: generateRandomPlayerName() || 'Player 1',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 2,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: generateRandomPlayerName() || 'Player 2',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 3,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: generateRandomPlayerName() || 'Player 3',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 4,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: generateRandomPlayerName() || 'Player 4',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 5,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: generateRandomPlayerName() || 'Player 5',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
		allowNegativeLife: false,
		isFirst: false,
		highlighted: false,
		isDead: false
	},
	{
		id: 6,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: generateRandomPlayerName() || 'Player 6',
		color: 'white',
		backgroundImage: null,
		backgroundArtist: null,
		backgroundSet: null,
		tempLifeDiff: 0,
		poison: 0,
		statusEffects: {},
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
				const second_choices = [
					'mud',
					'metalicgray',
					'gold',
					'purple',
					'pink',
					'orange',
					'lightgreen'
				];
				return defaultPlayers.map((p) => ({
					...p,
					color: `${first_choices[Math.floor(Math.random() * first_choices.length)]},${second_choices[Math.floor(Math.random() * second_choices.length)]}`
				}));
			}
		} catch (e) {
			// if any error, fall back to defaults
		}
	}

	return defaultPlayers;
};

export const players: Writable<App.Player.Data[]> = persist('players', getInitialPlayers());

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

export const setPlayerBackgroundImage = (
	playerId: number,
	imageUrlOrPayload: string | null | { imageUrl: string | null; artist?: string | null; set_name?: string | null }
) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				let image: string | null = null;
				let artist: string | null = null;
				let set_name: string | null = null;

				if (typeof imageUrlOrPayload === 'string' || imageUrlOrPayload === null) {
					image = imageUrlOrPayload;
				} else {
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
	players.update((currentPlayers) => {
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
};

export const setPlayerStatusNumeric = (playerId: number, key: string, value: number) => {
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
};

export const setCommanderDamage = (playerId: number, fromPlayerId: number, amount: number) => {
	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				const commanderDamage = player.statusEffects?.commanderDamage || [];
				// Ensure the array has enough entries (indexed by fromPlayerId - 1)
				while (commanderDamage.length < fromPlayerId) {
					commanderDamage.push(0);
				}
				// Update the damage from the specific player
				commanderDamage[fromPlayerId - 1] = Math.max(0, Math.min(999, amount));

				return {
					...player,
					statusEffects: {
						...player.statusEffects,
						commanderDamage: [...commanderDamage]
					}
				};
			}
			return player;
		});
	});
};

// Object to store timeout references for each player
const resetTimers: { [key: number]: number } = {};

export const resetLifeTotals = async (alreadyConfirmed: boolean) => {
	let resetProfiles = false;

	if (!alreadyConfirmed) {
		const result = await showConfirm(
			get(_)('window_confirm_reset_game') || 'Are you sure you want to continue?',
			{
				checkboxLabel:
					get(_)('reset_player_profiles_checkbox') || 'Also reset player profiles (colors)',
				checkboxDefaultValue: false
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
			resetProfiles = result.checkboxValue ?? false;
		}
	}

	const startingLifeTotal = get(appSettings).startingLifeTotal;
	removeFirstPlace();

	// reset current turn and turn count
	setCurrentTurn(0, false);
	appState.update((data) => ({ ...data, currentTurn: -1, turnCount: 0, startingPlayerIndex: null }));
	vibrate(30);

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
				statusEffects: {
					commanderDamage: [] // Reset commander damage
				}
			};

			// If resetProfiles is enabled, reset color and backgroundImage to defaults
			if (resetProfiles) {
				updatedPlayer.color = 'white';
				updatedPlayer.backgroundImage = null;
			}

			return updatedPlayer;
		});
	});

	spinToSelectFirstPlayer();
};

export const setPlayerLifeTotal = (playerId: number, amount: number) => {
	players.update((currentPlayers) => {
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

	// Update the life total
	players.update((currentPlayers) => {
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
	// removeFirstPlace();
	let withinBounds = false; // Flag to determine if setTempLifeDiff should be called
	if (amount <= 1) {
		vibrate(10);
	} else {
		vibrate(40);
	}

	players.update((currentPlayers) => {
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

	// Only run this if life total is within bounds
	// recompute withinBounds according to allowed min when needed
	if (withinBounds) {
		setTempLifeDiff(playerId, type, amount);
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
