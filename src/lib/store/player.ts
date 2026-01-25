import { get, writable, derived, type Writable } from 'svelte/store';
import { appSettings } from './appSettings';
import { _ } from 'svelte-i18n';  // i18n language toggle

const playerBaseName = get(_)('player') || 'Player';

// Au lieu d'une valeur statique, créez un store dérivé pour les labels
export const playerBaseName2 = derived(_, ($_t) => {
    return $_t('player') || 'Player';
});

export const players: Writable<App.Player.Data[]> = writable([
	{
		id: 1,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: `${playerBaseName} 1`,
		tempLifeDiff: 0,
		isFirst: false,
		highlighted: false
	},
	{
		id: 2,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: `${playerBaseName} 2`,
		tempLifeDiff: 0,
		isFirst: false,
		highlighted: false
	},
	{
		id: 3,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: `${playerBaseName} 3`,
		tempLifeDiff: 0,
		isFirst: false,
		highlighted: false
	},
	{
		id: 4,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: `${playerBaseName} 4`,
		tempLifeDiff: 0,
		isFirst: false,
		highlighted: false
	},
	{
		id: 5,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: `${playerBaseName} 5`,
		tempLifeDiff: 0,
		isFirst: false,
		highlighted: false
	},
	{
		id: 6,
		lifeTotal: get(appSettings).startingLifeTotal,
		playerName: `${playerBaseName} 6`,
		tempLifeDiff: 0,
		isFirst: false,
		highlighted: false
	}
]);

// Object to store timeout references for each player
const resetTimers: { [key: number]: number } = {};

export const resetLifeTotals = () => {
	const startingLifeTotal = get(appSettings).startingLifeTotal;
	removeFirstPlace();

	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			// Clear any existing timer for this player
			if (resetTimers[player.id]) {
				clearTimeout(resetTimers[player.id]);
				delete resetTimers[player.id]; // Remove the timer reference
			}

			return {
				...player,
				lifeTotal: startingLifeTotal,
				tempLifeDiff: 0 // Reset tempLifeDiff to 0
			};
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

export const manageLifeTotal = (
	type: App.Player.LifeMoveType,
	playerId: number,
	amount: number = 1
) => {
	removeFirstPlace();
	let withinBounds = false; // Flag to determine if setTempLifeDiff should be called

	players.update((currentPlayers) => {
		return currentPlayers.map((player) => {
			if (player.id === playerId) {
				let newLifeTotal = player.lifeTotal;

				if (type === 'add') {
					newLifeTotal += amount;
					withinBounds = newLifeTotal <= 999; // Check if within bounds
				} else if (type === 'subtract') {
					newLifeTotal -= amount;
					withinBounds = newLifeTotal >= 0; // Check if within bounds
				}

				// Ensure the life total is within acceptable bounds
				newLifeTotal = Math.max(0, Math.min(999, newLifeTotal));

				return {
					...player,
					lifeTotal: newLifeTotal
				};
			}
			return player;
		});
	});

	// Only run this if life total is within bounds
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
				}, 6000);

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

let isSpinning = false;

const spinToSelectFirstPlayer = () => {
	const totalPlayers = get(appSettings).playerCount;
	if (totalPlayers === 0) return;

	isSpinning = true;
	let currentIndex = 0;
	let spinCount = Math.floor(Math.random() * 10) + totalPlayers * 4;
	let intervalTime = 100;
	const finalPauseTime = 500;

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
				isSpinning = false;
				players.update((currentPlayers) => {
					return currentPlayers.map((player, index) => {
						return {
							...player,
							isFirst: index === (currentIndex - 1) % totalPlayers,
							highlighted: false
						};
					});
				});
			}, finalPauseTime);
		}
	};

	spin();
};
