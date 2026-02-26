/**
 * Environment configuration
 *
 * Uses react-native-config which reads from .env files.
 */

import Config from 'react-native-config';

const envObj = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const getEnv = (key: string, defaultValue: string = ''): string => {
  return (Config as Record<string, string | undefined>)?.[key] ??
    envObj[key] ??
    defaultValue;
};

export const env = {
  // API URL
  API_URL: getEnv('EXPO_PUBLIC_API_URL', 'http://localhost:3001'),

  // Firebase
  FIREBASE_API_KEY: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGING_SENDER_ID: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_APP_ID: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),

  // Development
  DEV_MODE: getEnv('EXPO_PUBLIC_DEV_MODE', 'false') === 'true',
};

/** Firebase config object for the JS SDK (used on desktop) */
export const FIREBASE_CONFIG = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

/** Google OAuth config for desktop PKCE flow */
export const GOOGLE_OAUTH_CONFIG = {
  clientId: getEnv('GOOGLE_OAUTH_CLIENT_ID'),
  iosClientId: getEnv('GOOGLE_OAUTH_IOS_CLIENT_ID'),
  reversedClientId: getEnv('GOOGLE_OAUTH_REVERSED_CLIENT_ID'),
};
