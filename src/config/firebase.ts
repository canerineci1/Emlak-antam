import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const defaultFirebaseConfig = {
  apiKey: "AIzaSyAx6FczK2RKaRqg3W_65bO1Rqc1b4QI8dw",
  authDomain: "emlakofisim-b5d57.firebaseapp.com",
  projectId: "emlakofisim-b5d57",
  storageBucket: "emlakofisim-b5d57.firebasestorage.app",
  messagingSenderId: "448501546664",
  appId: "1:448501546664:web:c89f5f218e33c033124c9d",
  measurementId: "G-YGGFGB96H9"
};

let app: any = null;
let db: any = null;
let storage: any = null;
let auth: any = null;

try {
  app = !getApps().length ? initializeApp(defaultFirebaseConfig) : getApp();
  db = getFirestore(app);
  storage = getStorage(app);
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch {
    auth = getAuth(app);
  }
} catch (e) {
  console.warn('Firebase initialization note:', e);
}

export { app, db, storage, auth };
export default app;
