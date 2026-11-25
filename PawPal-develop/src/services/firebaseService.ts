import { getApps, initializeApp } from 'firebase/app';
import * as authSdk from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { firebaseConfig, firebaseEmulators } from './firebaseConfig';
import type { Persistence } from 'firebase/auth';

export type AuthStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
let storage: AuthStorage | undefined;
let clients:
  | { auth: authSdk.Auth; database: ReturnType<typeof getDatabase> }
  | undefined;

// Injected by the native app; this service also works on Web without native imports.
export function configureAuthStorage(value: AuthStorage) {
  storage = value;
}
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.databaseURL &&
      firebaseConfig.appId,
  );
}
export function getFirebase() {
  if (clients) {
    return clients;
  }
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Kết nối tài khoản chưa được cấu hình. Xem hướng dẫn FIREBASE_SETUP.md.',
    );
  }
  const app =
    getApps().find(item => item.name === 'pawpal') ||
    initializeApp(firebaseConfig, 'pawpal');
  const rnAuth = authSdk as typeof authSdk & {
    getReactNativePersistence?: (value: AuthStorage) => Persistence;
  };
  const auth =
    storage && rnAuth.getReactNativePersistence
      ? authSdk.initializeAuth(app, {
          persistence: rnAuth.getReactNativePersistence(storage),
        })
      : authSdk.getAuth(app);
  const database = getDatabase(app, firebaseConfig.databaseURL);
  if (firebaseEmulators.enabled) {
    authSdk.connectAuthEmulator(
      auth,
      `http://${firebaseEmulators.host}:${firebaseEmulators.authPort}`,
      { disableWarnings: true },
    );
    connectDatabaseEmulator(
      database,
      firebaseEmulators.host,
      firebaseEmulators.databasePort,
    );
  }
  clients = { auth, database };
  return clients;
}
