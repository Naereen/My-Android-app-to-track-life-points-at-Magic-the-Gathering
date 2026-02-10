import { StatusBar, Style } from '@capacitor/status-bar';

export const setupStatusBar = async () => {
    // Empêche la WebView de s'afficher "sous" la barre d'état
    await StatusBar.setOverlaysWebView({ overlay: false });

    // Vous pouvez aussi changer la couleur pour l'assortir à votre app MTG
    await StatusBar.setBackgroundColor({ color: '#062911' });
    await StatusBar.setStyle({ style: Style.Dark });

    // Affiche la barre d'état (au cas où elle serait cachée)
    await StatusBar.show();
};

// setupStatusBar();
