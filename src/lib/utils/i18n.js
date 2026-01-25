import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

// On lie les fichiers JSON de traduction
register('en', () => import('../../locales/en.json'));
register('fr', () => import('../../locales/fr.json'));

init({
    fallbackLocale: 'en',
    initialLocale: getLocaleFromNavigator(), // Détecte la langue du téléphone
});
