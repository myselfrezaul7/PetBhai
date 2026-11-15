import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.petbhai.app',
  appName: 'PetBhai',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Route window.fetch / XMLHttpRequest through the native HTTP stack on Android/iOS.
    // Native requests are not subject to WebView CORS, so the app can talk to
    // https://www.petbhai.com/api from its https://localhost origin.
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
