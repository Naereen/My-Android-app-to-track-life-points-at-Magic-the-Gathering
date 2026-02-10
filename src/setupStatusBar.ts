import { StatusBar, Style } from '@capacitor/status-bar';
// import { NavigationBar } from '@capacitor/navigation-bar';

export const setupStatusBar = async () => {
    // Empêche la WebView de s'afficher "sous" la barre d'état
    await StatusBar.setOverlaysWebView({ overlay: false });

    // Vous pouvez aussi changer la couleur pour l'assortir à votre app MTG
    await StatusBar.setBackgroundColor({ color: '#062911' });
    await StatusBar.setStyle({ style: Style.Dark });

    // Affiche la barre d'état (au cas où elle serait cachée)
    await StatusBar.show();

    // Si vous voulez aussi gérer la barre de navigation (sur Android), vous pouvez faire quelque chose comme ça :
    // await NavigationBar.setBackgroundColor({ color: '#062911' });
    // await NavigationBar.setInsetBackground({ inset: true });
};

// setupStatusBar();
