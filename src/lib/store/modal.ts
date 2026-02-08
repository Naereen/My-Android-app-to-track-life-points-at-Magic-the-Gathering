import { get, writable } from 'svelte/store';
import { appSettings } from './appSettings';
import { players } from './player';
import { vibrate } from '../utils/haptics';

type RandomizerModalState = {
	isOpen: boolean;
	result: number;
	type: string;
	playerId: number | null;
	playerName: string | null;
		backgroundImage?: string | string[] | null;
};

const initialRandomizerModalState: RandomizerModalState = { isOpen: false, result: 0, type: '', playerId: null, playerName: null, backgroundImage: null };

export const randomizerModalData = writable<RandomizerModalState>(initialRandomizerModalState);

export const generateRandomNumber = (type: string) => {
	vibrate(20);
	const dieTypes: { [key: string]: number | null } = {
		d2: 2,
		d4: 4,
		d6: 6,
		d8: 8,
		d10: 10,
		d12: 12,
		d20: 20,
		custom: get(appSettings).customRandomNumber
	};

	const max = dieTypes[type] || 0;
	const result = max > 0 ? Math.floor(Math.random() * max) + 1 : 0;
	randomizerModalData.set({ isOpen: true, result, type, playerId: null, playerName: null, backgroundImage: null });

	return result;
};

export const selectRandomPlayer = (randomIndex: number | null = null) => {
	vibrate(20);
	const currentPlayers = get(players);
	const playerCount = get(appSettings).playerCount;

	// Get only active players (up to playerCount)
	const activePlayers = currentPlayers.slice(0, playerCount);

	if (activePlayers.length === 0) return;

	const index = randomIndex !== null ? randomIndex : Math.floor(Math.random() * activePlayers.length);
	const selectedPlayer = activePlayers[index];

	randomizerModalData.set({
		isOpen: true,
		result: 0,
		type: 'randomPlayer',
		playerId: selectedPlayer.id,
		playerName: selectedPlayer.playerName,
		backgroundImage: selectedPlayer.backgroundImage
	});
};

export const selectRandomOpponent = (activePlayerId: number) => {
	vibrate(20);
	const currentPlayers = get(players);
	const playerCount = get(appSettings).playerCount;

	// Get only active players (up to playerCount), excluding the active player
	const activePlayers = currentPlayers.slice(0, playerCount).filter(p => p.id !== activePlayerId);

	if (activePlayers.length === 0) return;

	const randomIndex = Math.floor(Math.random() * activePlayers.length);
	const selectedPlayer = activePlayers[randomIndex];

	randomizerModalData.set({
		isOpen: true,
		result: 0,
		type: 'randomOpponent',
		playerId: selectedPlayer.id,
		playerName: selectedPlayer.playerName,
		backgroundImage: selectedPlayer.backgroundImage
	});
};

export const resetRandomizer = () => {
	randomizerModalData.set(initialRandomizerModalState);
};

const initialPlayerModalData = { isOpen: false, playerId: 0 };

export const playerModalData = writable(initialPlayerModalData);

export const openPlayerModal = (playerId: number) => {
	playerModalData.set({ isOpen: true, playerId });
};

export const resetPlayerModalData = () => {
	playerModalData.set(initialPlayerModalData);
};

// Confirm modal store: holds a message and a resolver function for promise-based API
type ConfirmModalState = {
	isOpen: boolean;
	message: string;
	resolve: ((value: boolean | { confirmed: boolean; checkboxValue?: boolean }) => void) | null;
	checkboxLabel?: string;
	checkboxDefaultValue?: boolean;
};

const initialConfirmModalState: ConfirmModalState = { isOpen: false, message: '', resolve: null };

export const confirmModalData = writable<ConfirmModalState>(initialConfirmModalState);

export const showConfirm = (
	message: string,
	options?: { checkboxLabel?: string; checkboxDefaultValue?: boolean }
) => {
	return new Promise<boolean | { confirmed: boolean; checkboxValue?: boolean }>((resolve) => {
		confirmModalData.set({
			isOpen: true,
			message,
			resolve,
			checkboxLabel: options?.checkboxLabel,
			checkboxDefaultValue: options?.checkboxDefaultValue ?? false
		});
	});
};

export const respondConfirm = (value: boolean, checkboxValue?: boolean) => {
	const current = get(confirmModalData);
	if (current && current.resolve) {
		try {
			if (current.checkboxLabel !== undefined) {
				current.resolve({ confirmed: value, checkboxValue });
			} else {
				current.resolve(value);
			}
		} catch (e) {
			// ignore
		}
	}
	confirmModalData.set(initialConfirmModalState);
};
