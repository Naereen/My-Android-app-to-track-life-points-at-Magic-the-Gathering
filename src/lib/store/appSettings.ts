import { type Writable } from 'svelte/store';
import { persist } from './persist';
import { locale as i18nLocale } from 'svelte-i18n';

export const appSettings: Writable<App.Settings> = persist('appSettings', {
	playerCount: 4,
	startingLifeTotal: 40,
	customStartingLifeTotal: 60,
	customRandomNumber: 0,
	allowNegativeLife: false,
	preventScreenSleep: true,
	fourPlayerLayout: 'matrix',
	hapticsEnabled: true,
	locale: 'fr'
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

export const setPreventScreenSleep = (preventScreenSleep: boolean) => {
	appSettings.update((data) => ({ ...data, preventScreenSleep }));
};

export const setHapticsEnabled = (hapticsEnabled: boolean) => {
    appSettings.update((data) => ({ ...data, hapticsEnabled }));
};

export const setFourPlayerLayout = (layout: 'matrix' | 'stacked') => {
	appSettings.update((data) => ({ ...data, fourPlayerLayout: layout }));
};

export const setAppLocale = (locale: string) => {
	appSettings.update((data) => ({ ...data, locale }));
	try {
		i18nLocale.set(locale);
	} catch (e) {
		// ignore if i18n not initialized yet
	}
};
