import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.olatz.fitnessapp',
  appName: 'PULSE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0a0a0f',
    scrollEnabled: true,
  },
  android: {
    backgroundColor: '#0a0a0f',
  },
  plugins: {
    Geolocation: {
      iosPermissionStrings: {
        NSLocationWhenInUseUsageDescription:
          'PULSE necesita acceso a tu ubicación para registrar tus entrenamientos con GPS y mostrar el clima local.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'PULSE necesita acceso a tu ubicación para registrar tus entrenamientos con GPS y mostrar el clima local.',
      },
    },
    BiometricAuth: {
      iosPermissionStrings: {
        NSFaceIDUsageDescription: 'Utilizamos Face ID para un acceso rápido y seguro a tu cuenta.',
      },
      androidPermissionStrings: {
        title: 'Autenticación biométrica',
        message: 'PULSE necesita tu huella o reconocimiento facial para un acceso rápido y seguro.',
        cancelButtonText: 'Cancelar',
      },
    },
  },
};

export default config;
