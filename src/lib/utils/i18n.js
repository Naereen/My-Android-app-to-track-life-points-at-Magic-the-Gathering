import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

// On lie les fichiers JSON de traduction
await register('en', () => import('../../locales/en.json'));
await register('fr', () => import('../../locales/fr.json'));

init({
    fallbackLocale: 'fr', // Langue par défaut si la détection échoue
    initialLocale: getLocaleFromNavigator() // Détecte la langue du téléphone
    // initialLocale: 'fr' // Détecte la langue du téléphone
});
