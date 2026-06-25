import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marlog.orb',
  appName: 'MarLog ORB',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#f1f5f9',
    allowMixedContent: true
  },
  ios: {
    backgroundColor: '#f1f5f9',
    contentInset: 'automatic'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e40af',
      showSpinner: false,
      androidScaleType: 'CENTER_CROPPING',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
