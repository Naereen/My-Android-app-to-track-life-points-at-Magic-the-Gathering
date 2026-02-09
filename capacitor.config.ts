import type { CapacitorConfig } from '@capacitor/cli';

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
  }
};

export default config;
