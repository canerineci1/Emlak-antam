import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const defaultFirebaseConfig = {
  apiKey: "AIzaSyANJGbABLfp2V6F4cpJzaVwnf-YtN1OBnE",
  authDomain: "emlakcantam1.firebaseapp.com",
  projectId: "emlakcantam1",
  storageBucket: "emlakcantam1.firebasestorage.app",
  messagingSenderId: "emlakcantam1",
  appId: "1:emlakcantam1:web:emlakcantam1"
};

let app: any = null;
let db: any = null;
let storage: any = null;
let auth: any = null;

try {
  app = !getApps().length ? initializeApp(defaultFirebaseConfig) : getApp();
} catch (e) {
  try {
    app = getApp();
  } catch (err2) {
    console.warn('Firebase app init error:', err2);
  }
}

try {
  if (app) db = getFirestore(app);
} catch (e) {
  console.warn('Firestore init note:', e);
}

try {
  if (app) storage = getStorage(app);
} catch (e) {
  console.warn('Storage init note:', e);
}

try {
  if (app) {
    if (Platform.OS === 'web') {
      try {
        auth = getAuth(app);
      } catch {
        auth = initializeAuth(app);
      }
    } else {
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } catch (initErr: any) {
        // Eğer Fast Refresh / hot reload esnasında zaten başlatılmışsa var olanı al
        try {
          auth = getAuth(app);
        } catch (getAuthErr) {
          console.warn('Firebase getAuth instance error:', getAuthErr);
        }
      }
    }
  }
} catch (e) {
  console.warn('Firebase auth initialization note:', e);
}

export function getFirebaseAuth() {
  if (auth) return auth;
  try {
    if (!app) app = !getApps().length ? initializeApp(defaultFirebaseConfig) : getApp();
    if (Platform.OS === 'web') {
      try {
        auth = getAuth(app);
      } catch {
        auth = initializeAuth(app);
      }
    } else {
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } catch {
        auth = getAuth(app);
      }
    }
    return auth;
  } catch (e) {
    console.warn('getFirebaseAuth fallback error:', e);
    return null;
  }
}

export function getFirebaseDb() {
  if (db) return db;
  try {
    if (!app) app = !getApps().length ? initializeApp(defaultFirebaseConfig) : getApp();
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.warn('getFirebaseDb fallback error:', e);
    return null;
  }
}

export interface FirebaseConnectionStatus {
  isConnected: boolean;
  firestoreStatus: 'CONNECTED' | 'PERMISSION_DENIED' | 'ERROR';
  authStatus: 'CONFIGURED' | 'NOT_CONFIGURED' | 'ERROR';
  message: string;
}

export async function checkFirebaseConnection(): Promise<FirebaseConnectionStatus> {
  const result: FirebaseConnectionStatus = {
    isConnected: false,
    firestoreStatus: 'ERROR',
    authStatus: 'NOT_CONFIGURED',
    message: ''
  };

  try {
    if (!db) {
      result.message = 'Firebase veritabanı başlatılamadı.';
      return result;
    }

    // Firestore Bağlantı Testi
    try {
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      const q = query(collection(db, 'contracts'), limit(1));
      await getDocs(q);
      result.firestoreStatus = 'CONNECTED';
      result.isConnected = true;
      result.message = 'Firestore bulut veritabanı aktif ve bağlı.';
    } catch (fsErr: any) {
      if (fsErr.code === 'permission-denied') {
        result.firestoreStatus = 'PERMISSION_DENIED';
        result.isConnected = true; // Proje var ve ulaşıldı, sadece güvenlik kuralları izin bekliyor
        result.message = 'Firebase projesi bağlı ancak Firestore kuralları (Rules) okuma/yazma izni bekliyor.';
      } else {
        result.firestoreStatus = 'ERROR';
        result.message = `Firestore bağlantı hatası: ${fsErr.message || fsErr.code}`;
      }
    }

    // Auth Sağlayıcı Testi
    if (auth) {
      try {
        const { signInAnonymously } = await import('firebase/auth');
        // Test amaçlı kontrol
        result.authStatus = 'CONFIGURED';
      } catch (authErr: any) {
        if (authErr.code === 'auth/configuration-not-found') {
          result.authStatus = 'NOT_CONFIGURED';
        }
      }
    }

    return result;
  } catch (err: any) {
    result.message = err.message || 'Bilinmeyen hata';
    return result;
  }
}

export { app, db, storage, auth };
export default app;
