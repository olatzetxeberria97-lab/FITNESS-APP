import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitness.community.app',
  appName: 'PULSE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0a0a0f',
  },
  android: {
    backgroundColor: '#0a0a0f',
  },
  plugins: {
    Geolocation: {
      // iOS permissions strings — these are read by the Info.plist generator
      iosPermissionStrings: {
        NSLocationWhenInUseUsageDescription:
          'PULSE necesita acceso a tu ubicación para registrar tus entrenamientos con GPS y mostrar el clima local.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'PULSE necesita acceso a tu ubicación para registrar tus entrenamientos con GPS y mostrar el clima local.',
      },
    },
  },
};

export default config;
