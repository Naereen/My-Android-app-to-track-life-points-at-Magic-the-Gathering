import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

// On lie les fichiers JSON de traduction
register('en', () => import('../../locales/en.json'));
register('fr', () => import('../../locales/fr.json'));
register('es', () => import('../../locales/es.json'));
register('de', () => import('../../locales/de.json'));

init({
    fallbackLocale: 'fr', // Langue par défaut si la détection échoue
    initialLocale: getLocaleFromNavigator() // Détecte la langue du téléphone
    // initialLocale: 'fr' // Détecte la langue du téléphone
});
