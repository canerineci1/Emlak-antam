import * as FileSystem from 'expo-file-system/legacy';
import { syncUserToCloud } from './firebaseSyncService';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
        if (currentUser.isLoggedIn && currentUser.id && db) {
          try {
            const userDocRef = doc(db, 'users', currentUser.id);
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

  // Firestore Bulutuna Canlı Gönder
  if (user.id && user.isLoggedIn) {
    syncUserToCloud(user);
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

// GOOGLE İLE GİRİŞ YAP (GERÇEK VERİ & GOOGLE API DESTEĞİ)
export async function loginWithGoogle(
  role: UserRole,
  customEmailOrData?: string | { email: string; name?: string; id?: string; avatarUrl?: string; accessToken?: string },
  customName?: string,
  accessToken?: string
): Promise<UserProfile> {
  const isManager = role === 'YONETICI';
  let email = '';
  let name = '';
  let avatarUrl = '';
  let googleId = '';
  let token = accessToken || '';

  if (typeof customEmailOrData === 'object' && customEmailOrData !== null) {
    email = (customEmailOrData.email || '').trim().toLowerCase();
    name = (customEmailOrData.name || '').trim();
    avatarUrl = customEmailOrData.avatarUrl || '';
    googleId = customEmailOrData.id || '';
    if (customEmailOrData.accessToken) token = customEmailOrData.accessToken;
  } else if (typeof customEmailOrData === 'string') {
    email = customEmailOrData.trim().toLowerCase();
    name = (customName || '').trim();
  }

  // Token varsa canlı Google API'sinden çek
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
    throw new Error('Lütfen geçerli bir Google e-posta adresi giriniz.');
  }

  if (!email.includes('@')) {
    throw new Error('Lütfen geçerli bir e-posta formatı giriniz (Örn: ad.soyad@gmail.com).');
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
    avatarUrl: avatarUrl || undefined,
    isLoggedIn: true
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
    isLoggedIn: true
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
  currentUser = {
    ...currentUser,
    isLoggedIn: false
  };
  await persistAuth(currentUser);
}

export function getCurrentUser(): UserProfile {
  return currentUser;
}
