import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'link.besson.mtglifetracker',
  appName: "Naereen's MTG Life Tracker",
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchShowDuration: 500, // Temps d'affichage en ms
      launchAutoHide: true,
      backgroundColor: "#062911ff", // Couleur de fond (Hex avec Alpha)
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false, // On évite souvent le spinner pour un look plus "pro"
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#062911ff",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK", // "DARK" ou "LIGHT" selon votre thème
      backgroundColor: "#062911ff"
    },
    SystemBars: {
      insetsHandling: "disable", // Laisser les barres système gérer les insets pour éviter les problèmes de mise en page
      style: "DARK", // "DARK" ou "LIGHT" selon votre thème
      hidden: false, // On ne cache pas les barres pour permettre l'accès aux gestes de navigation, mais on les stylise pour qu'elles se fondent dans le thème de l'app
      // hidden: true, // On cache les barres (pour une expérience plus immersive)
      animation: "NONE"
    },
    // https://capacitorjs.com/docs/apis/keyboard
    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: false
    }
  }
};

export default config;
