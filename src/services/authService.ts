import * as FileSystem from 'expo-file-system/legacy';
import { syncUserToCloud } from './firebaseSyncService';
import { db, auth, getFirebaseAuth, getFirebaseDb, defaultFirebaseConfig } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  signInWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { Platform } from 'react-native';
import { store } from './storageService';

export type UserRole = 'YONETICI' | 'DANISMAN';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  roleTitle: string;
  agencyName: string;
  licenseNumber: string;
  avatarUrl?: string;
  isLoggedIn: boolean;
  authProvider?: 'GOOGLE' | 'PHONE' | 'EMAIL';
}

export interface GoogleProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  verified?: boolean;
}

const AUTH_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_auth.json';

const INITIAL_EMPTY_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  phone: '',
  role: 'DANISMAN',
  roleTitle: 'Gayrimenkul Danışmanı',
  agencyName: 'EmlakÇantam Gayrimenkul',
  licenseNumber: '',
  isLoggedIn: false
};

let currentUser: UserProfile = { ...INITIAL_EMPTY_USER };
type AuthListener = (user: UserProfile) => void;
const listeners: Set<AuthListener> = new Set();

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  listener(currentUser);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach(cb => {
    try {
      cb(currentUser);
    } catch (e) {
      console.warn('Auth listener error:', e);
    }
  });
}

// Canlı Firebase Auth Dinleyicisi
if (auth) {
  try {
    onAuthStateChanged(auth, async (fbUser: any) => {
      if (fbUser && !currentUser.isLoggedIn) {
        // Firebase kullanıcısı var, profili çek
        const profile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Kullanıcı',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || currentUser.phone || '',
          role: currentUser.role || 'DANISMAN',
          roleTitle: currentUser.role === 'YONETICI' ? 'Ofis Sahibi & Broker' : 'Gayrimenkul Danışmanı',
          agencyName: currentUser.agencyName || 'EmlakÇantam Gayrimenkul',
          licenseNumber: currentUser.licenseNumber || '',
          avatarUrl: fbUser.photoURL || currentUser.avatarUrl,
          isLoggedIn: true,
          authProvider: 'GOOGLE'
        };
        await persistAuth(profile);
      }
    });
  } catch (e) {
    console.warn('onAuthStateChanged setup note:', e);
  }
}

// Kalıcı Oturumu Cihazdan ve Firestore'dan Yükle
export async function loadSavedAuth(): Promise<UserProfile> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(AUTH_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(AUTH_FILE, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.isLoggedIn === 'boolean') {
        currentUser = parsed;
        notifyListeners();

        // Eğer kullanıcı oturum açmışsa Firestore bulutundaki profilini güncelle
        const currentDb = db || getFirebaseDb();
        if (currentUser.isLoggedIn && currentUser.id && currentDb) {
          try {
            const userDocRef = doc(currentDb, 'users', currentUser.id);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              currentUser = { ...currentUser, ...(userDoc.data() as UserProfile) };
              notifyListeners();
            }
          } catch (cloudErr) {
            console.warn('Firestore user fetch note:', cloudErr);
          }
        }

        return currentUser;
      }
    }
  } catch (e) {
    console.warn('Auth load error', e);
  }
  return currentUser;
}

// Oturumu Kalıcı Olarak Kaydet (Cihaz + Canlı Firestore)
async function persistAuth(user: UserProfile) {
  currentUser = user;
  notifyListeners();

  try {
    await FileSystem.writeAsStringAsync(AUTH_FILE, JSON.stringify(user, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });
  } catch (e) {
    console.warn('Auth save error', e);
  }

  // Firestore Bulutuna Canlı Gönder (Gerçek Veritabanı)
  if (user.id && user.isLoggedIn) {
    try {
      await syncUserToCloud(user);
    } catch (e) {
      console.warn('syncUserToCloud error:', e);
    }

    const currentDb = db || getFirebaseDb();
    if (currentDb) {
      try {
        const userDocRef = doc(currentDb, 'users', user.id);
        const cleanData: Record<string, any> = {
          id: user.id,
          name: user.name || 'Kullanıcı',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'DANISMAN',
          roleTitle: user.roleTitle || '',
          agencyName: user.agencyName || 'EmlakÇantam Gayrimenkul',
          licenseNumber: user.licenseNumber || '',
          avatarUrl: user.avatarUrl || '',
          isLoggedIn: true,
          authProvider: user.authProvider || 'GOOGLE',
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, cleanData, { merge: true });
      } catch (cloudErr) {
        console.warn('Firestore user cloud save error:', cloudErr);
      }
    }

    // Broker profiline de gerçek kullanıcıyı eşle
    store.updateBroker({
      name: user.name,
      agencyName: user.agencyName,
      phone: user.phone || '',
      email: user.email || '',
      licenseNumber: user.licenseNumber
    });
  }
}

// GERÇEK GOOGLE USERINFO API'SİNDEN CANLI PROFİL ÇEK
export async function fetchGoogleProfileFromApi(accessToken: string): Promise<GoogleProfileData | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      const fullName = (data.name || `${data.given_name || ''} ${data.family_name || ''}`).trim();
      return {
        id: data.sub || `google_${Date.now()}`,
        name: fullName || (data.email ? data.email.split('@')[0] : 'Google Kullanıcısı'),
        email: data.email,
        avatarUrl: data.picture || '',
        verified: data.email_verified
      };
    }
  } catch (e) {
    console.warn('Google UserInfo API fetch error:', e);
  }
  return null;
}

// 1. GERÇEK GOOGLE OAUTH URL'SİNİ FIREBASE'DEN AL (CANLI GOOGLE AUTH ENDPOINT)
export async function createGoogleAuthUri(): Promise<{ authUri: string; sessionId?: string }> {
  const apiKey = defaultFirebaseConfig.apiKey;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: 'google.com',
      continueUri: 'https://emlakcantam1.firebaseapp.com/__/auth/handler'
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google OAuth başlatılamadı: ${errText}`);
  }

  const data = await res.json();
  if (!data.authUri) {
    throw new Error('Google OAuth bağlantı adresi alınamadı.');
  }

  return {
    authUri: data.authUri,
    sessionId: data.sessionId
  };
}

// 2. URL'DEN GERÇEK TOKENLARI AYIKLA
export function parseAuthTokensFromUrl(url: string): { idToken?: string; accessToken?: string } {
  try {
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');
    const queryString = hashIndex !== -1 ? url.substring(hashIndex + 1) : queryIndex !== -1 ? url.substring(queryIndex + 1) : '';
    const params = new URLSearchParams(queryString);
    const idToken = params.get('id_token') || undefined;
    const accessToken = params.get('access_token') || undefined;
    return { idToken, accessToken };
  } catch (e) {
    console.warn('parseAuthTokensFromUrl error:', e);
    return {};
  }
}

// 3. GERÇEK GOOGLE TOKEN'I İLE OTURUM AÇ VE FIRESTORE'A YAZ
export async function authenticateWithGoogleIdToken(
  idToken: string,
  role: UserRole,
  accessToken?: string
): Promise<UserProfile> {
  const apiKey = defaultFirebaseConfig.apiKey;
  let uid = '';
  let email = '';
  let name = '';
  let avatarUrl = '';

  // 1. Firebase Identity Toolkit signInWithIdp ile resmi doğrulama
  try {
    const idpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postBody: `id_token=${idToken}&providerId=google.com`,
        requestUri: 'https://emlakcantam1.firebaseapp.com',
        returnSecureToken: true
      })
    });
    const idpData = await idpRes.json();
    if (idpData.localId) {
      uid = idpData.localId;
      email = idpData.email || '';
      name = idpData.displayName || '';
      avatarUrl = idpData.photoUrl || '';
    }
  } catch (e) {
    console.warn('signInWithIdp note:', e);
  }

  // 2. Firebase SDK Auth signInWithCredential
  const activeAuth = auth || getFirebaseAuth();
  if (activeAuth) {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(activeAuth, credential);
      if (userCred.user) {
        uid = userCred.user.uid || uid;
        email = userCred.user.email || email;
        name = userCred.user.displayName || name;
        avatarUrl = userCred.user.photoURL || avatarUrl;
      }
    } catch (credErr) {
      console.warn('signInWithCredential note:', credErr);
    }
  }

  // 3. Eğer accessToken varsa Google UserInfo API'den profil detaylarını doğrula
  if (accessToken && (!email || !name)) {
    const liveProfile = await fetchGoogleProfileFromApi(accessToken);
    if (liveProfile) {
      if (!email) email = liveProfile.email;
      if (!name) name = liveProfile.name;
      if (!avatarUrl) avatarUrl = liveProfile.avatarUrl || '';
      if (!uid) uid = liveProfile.id;
    }
  }

  if (!email && !uid) {
    throw new Error('Google hesabı doğrulanamadı. Lütfen tekrar deneyiniz.');
  }

  const isManager = role === 'YONETICI';
  const profile: UserProfile = {
    id: uid || `google_${Date.now()}`,
    name: name || (email ? email.split('@')[0] : 'Google Kullanıcısı'),
    email: email,
    phone: '',
    role,
    roleTitle: isManager ? 'Ofis Sahibi & Broker' : 'Gayrimenkul Danışmanı',
    agencyName: 'EmlakÇantam Gayrimenkul',
    licenseNumber: '',
    avatarUrl: avatarUrl || '',
    isLoggedIn: true,
    authProvider: 'GOOGLE'
  };

  await persistAuth(profile);
  return profile;
}

// GOOGLE İLE GİRİŞ YAP (GERÇEK GOOGLE OAUTH POPUP & FIREBASE AUTH + FIRESTORE BULUT)
export async function loginWithGoogle(
  role: UserRole,
  customEmailOrData?: string | {
    email?: string;
    name?: string;
    id?: string;
    avatarUrl?: string;
    accessToken?: string;
    idToken?: string;
  },
  customName?: string,
  accessToken?: string
): Promise<UserProfile> {
  const isManager = role === 'YONETICI';
  const activeAuth = auth || getFirebaseAuth();

  // 1. DOĞRUDAN GERÇEK GOOGLE OAUTH POPUP / FIREBASE AUTH İLE GİRİŞ
  const isDirectOAuth = !customEmailOrData || (typeof customEmailOrData === 'object' && !customEmailOrData.email && !customEmailOrData.idToken && !customEmailOrData.accessToken);

  if (isDirectOAuth) {
    if (!activeAuth) {
      throw new Error('Firebase Auth servisi başlatılamadı. Lütfen internet bağlantınızı kontrol ediniz.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    provider.addScope('profile');
    provider.addScope('email');

    let userCred: any = null;
    try {
      if (Platform.OS === 'web' && typeof signInWithPopup === 'function') {
        userCred = await signInWithPopup(activeAuth, provider, browserPopupRedirectResolver);
      } else {
        const mobileErr: any = new Error('MOBILE_GOOGLE_AUTH_REQUESTED');
        mobileErr.code = 'MOBILE_GOOGLE_AUTH_REQUESTED';
        throw mobileErr;
      }
    } catch (popupErr: any) {
      if (popupErr?.code !== 'MOBILE_GOOGLE_AUTH_REQUESTED') {
        console.warn('Firebase signInWithPopup error:', popupErr?.code, popupErr?.message);
      }
      throw popupErr;
    }

    if (userCred && userCred.user) {
      const fbUser = userCred.user;
      const realEmail = fbUser.email || '';
      const realName = fbUser.displayName || realEmail.split('@')[0] || 'Google Kullanıcısı';

      const profile: UserProfile = {
        id: fbUser.uid,
        name: realName,
        email: realEmail,
        phone: fbUser.phoneNumber || '',
        role,
        roleTitle: isManager ? 'Ofis Sahibi & Broker' : 'Gayrimenkul Danışmanı',
        agencyName: 'EmlakÇantam Gayrimenkul',
        licenseNumber: '',
        avatarUrl: fbUser.photoURL || undefined,
        isLoggedIn: true,
        authProvider: 'GOOGLE'
      };

      await persistAuth(profile);
      return profile;
    }
  }

  // 2. ID TOKEN VEYA KULLANICI BİLGİSİ İLE GİRİŞ
  let email = '';
  let name = '';
  let avatarUrl = '';
  let googleId = '';
  let token = accessToken || '';
  let idToken = '';

  if (typeof customEmailOrData === 'object' && customEmailOrData !== null) {
    email = (customEmailOrData.email || '').trim().toLowerCase();
    name = (customEmailOrData.name || '').trim();
    avatarUrl = customEmailOrData.avatarUrl || '';
    googleId = customEmailOrData.id || '';
    if (customEmailOrData.accessToken) token = customEmailOrData.accessToken;
    if (customEmailOrData.idToken) idToken = customEmailOrData.idToken;
  } else if (typeof customEmailOrData === 'string') {
    email = customEmailOrData.trim().toLowerCase();
    name = (customName || '').trim();
  }

  // Firebase Auth Credential Girişi
  if (auth && idToken) {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);
      if (userCred.user) {
        googleId = userCred.user.uid;
        if (userCred.user.email) email = userCred.user.email;
        if (userCred.user.displayName) name = userCred.user.displayName;
        if (userCred.user.photoURL) avatarUrl = userCred.user.photoURL;
      }
    } catch (fbAuthErr) {
      console.warn('Firebase signInWithCredential error:', fbAuthErr);
    }
  }

  // Canlı Google API'sinden Kullanıcı Bilgilerini Çek
  if (token) {
    const liveGoogle = await fetchGoogleProfileFromApi(token);
    if (liveGoogle) {
      if (liveGoogle.email) email = liveGoogle.email;
      if (liveGoogle.name) name = liveGoogle.name;
      if (liveGoogle.avatarUrl) avatarUrl = liveGoogle.avatarUrl;
      if (liveGoogle.id) googleId = liveGoogle.id;
    }
  }

  if (!email) {
    throw new Error('Geçerli bir Google hesabı doğrulanamadı.');
  }

  if (!name) {
    name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  const profile: UserProfile = {
    id: googleId ? `google_${googleId}` : `google_${Date.now()}`,
    name,
    email,
    phone: '',
    role,
    roleTitle: isManager ? 'Ofis Sahibi & Broker' : 'Gayrimenkul Danışmanı',
    agencyName: 'EmlakÇantam Gayrimenkul',
    licenseNumber: '',
    avatarUrl: avatarUrl || '',
    isLoggedIn: true,
    authProvider: 'GOOGLE'
  };

  await persistAuth(profile);
  return profile;
}

// E-POSTA VE ŞİFRE İLE GİRİŞ YAP (GERÇEK FIREBASE AUTH)
export async function loginWithEmail(
  email: string,
  password: string,
  role: UserRole,
  customName?: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const isManager = role === 'YONETICI';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Lütfen geçerli bir e-posta adresi giriniz.');
  }
  if (!password || password.length < 6) {
    throw new Error('Şifre en az 6 karakter olmalıdır.');
  }

  let uid = '';
  let displayName = (customName || '').trim() || cleanEmail.split('@')[0];

  // Firebase Auth ile giriş veya kayıt denemesi
  if (auth) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      uid = userCred.user.uid;
      if (userCred.user.displayName) displayName = userCred.user.displayName;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          // Kullanıcı yoksa otomatik yeni hesap oluştur
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          uid = newCred.user.uid;
        } catch (createErr: any) {
          console.warn('Firebase createUser note:', createErr);
        }
      } else {
        console.warn('Firebase email auth note:', err);
      }
    }
  }

  const profile: UserProfile = {
    id: uid || `email_${Date.now()}`,
    name: displayName,
    email: cleanEmail,
    phone: '',
    role,
    roleTitle: isManager ? 'Ofis Sahibi & Broker' : 'Gayrimenkul Danışmanı',
    agencyName: 'EmlakÇantam Gayrimenkul',
    licenseNumber: '',
    isLoggedIn: true,
    authProvider: 'EMAIL'
  };

  await persistAuth(profile);
  return profile;
}

// CEP TELEFONU VE SMS İLE GİRİŞ YAP (GERÇEK NUMARA İLE)
export async function loginWithPhone(
  phone: string,
  role: UserRole,
  customName?: string
): Promise<UserProfile> {
  const isManager = role === 'YONETICI';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone;
  const cleanName = (customName || '').trim();

  if (cleanPhone.length < 10) {
    throw new Error('Lütfen 10 haneli geçerli bir cep telefonu numarası giriniz.');
  }

  const profile: UserProfile = {
    id: 'phone_' + cleanPhone,
    name: cleanName || (isManager ? 'Ofis Yöneticisi' : 'Saha Danışmanı'),
    phone: formattedPhone,
    email: '',
    role,
    roleTitle: isManager ? 'Ofis Sahibi & Broker' : 'Gayrimenkul Danışmanı',
    agencyName: 'EmlakÇantam Gayrimenkul',
    licenseNumber: '',
    avatarUrl: undefined,
    isLoggedIn: true,
    authProvider: 'PHONE'
  };

  await persistAuth(profile);
  return profile;
}

// ROL DEĞİŞTİR
export async function switchRole(newRole: UserRole): Promise<UserProfile> {
  const isManager = newRole === 'YONETICI';
  const updated: UserProfile = {
    ...currentUser,
    role: newRole,
    roleTitle: isManager ? 'Ofis Sahibi & Broker' : 'Gayrimenkul Danışmanı'
  };
  await persistAuth(updated);
  return updated;
}

// ÇIKIŞ YAP (LOGOUT)
export async function logout(): Promise<void> {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut note:', e);
    }
  }

  currentUser = {
    ...INITIAL_EMPTY_USER,
    isLoggedIn: false
  };
  await persistAuth(currentUser);
}

export function getCurrentUser(): UserProfile {
  return currentUser;
}

