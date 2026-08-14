import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

// i18n is initialized in a client hook so every route (including stream overlay)
// sees the same translation registry before UI components subscribe to locale data.

// On lie les fichiers JSON de traduction
register('en', () => import('./locales/en.json'));
register('fr', () => import('./locales/fr.json'));
register('es', () => import('./locales/es.json'));
register('pt', () => import('./locales/pt.json'));
register('de', () => import('./locales/de.json'));
register('it', () => import('./locales/it.json'));
register('ja', () => import('./locales/ja.json'));
register('ru', () => import('./locales/ru.json'));
register('zh-CN', () => import('./locales/zh-CN.json'));
register('nl', () => import('./locales/nl.json'));
register('pl', () => import('./locales/pl.json'));
register('tr', () => import('./locales/tr.json'));
register('ko', () => import('./locales/ko.json'));

init({
	fallbackLocale: 'fr', // Langue par défaut si la détection échoue
	initialLocale: getLocaleFromNavigator() // Détecte la langue du téléphone
	// initialLocale: 'fr' // Détecte la langue du téléphone
});
