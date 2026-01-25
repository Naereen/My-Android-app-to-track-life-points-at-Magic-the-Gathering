import { type Writable } from 'svelte/store';
import { persist } from './persist';

export const appSettings: Writable<App.Settings> = persist('appSettings', {
	playerCount: 4,
	startingLifeTotal: 40,
	customStartingLifeTotal: 60,
	customRandomNumber: 0,
	allowNegativeLife: false
});

export const setPlayerCount = (playerCount: number) => {
	appSettings.update((data) => ({ ...data, playerCount }));
};

export const setStartingLifeTotal = (startingLifeTotal: number) => {
	appSettings.update((data) => ({ ...data, startingLifeTotal }));
};

export const setCustomStartingLifeTotal = (customStartingLifeTotal: number) => {
	appSettings.update((data) => ({ ...data, customStartingLifeTotal }));
};

export const setCustomRandomNumber = (customRandomNumber: number) => {
	appSettings.update((data) => ({ ...data, customRandomNumber }));
};

export const setAllowNegativeLife = (allowNegativeLife: boolean) => {
    appSettings.update((data) => ({ ...data, allowNegativeLife }));
};
