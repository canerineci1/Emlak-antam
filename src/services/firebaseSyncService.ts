import { db, storage } from '../config/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';

const FIREBASE_CONFIG_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_firebase_config.json';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Bulut Konfigürasyonu Kayıtlı mı Kontrolü
export async function getSavedFirebaseConfig(): Promise<FirebaseCustomConfig | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(FIREBASE_CONFIG_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(FIREBASE_CONFIG_FILE, { encoding: FileSystem.EncodingType.UTF8 });
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn('Firebase config read error', e);
  }
  return null;
}

// Kullanıcının Girdiği Firebase Bilgilerini Kaydet
export async function saveFirebaseConfig(config: FirebaseCustomConfig): Promise<boolean> {
  try {
    await FileSystem.writeAsStringAsync(FIREBASE_CONFIG_FILE, JSON.stringify(config, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });
    return true;
  } catch (e) {
    console.warn('Firebase config save error', e);
    return false;
  }
}

// GENEL KOLEKSİYON GETİRME (BULUTTAN ÇEK)
export async function fetchCollectionFromCloud<T>(collectionName: string): Promise<T[]> {
  try {
    if (!db) return [];
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((document: any) => {
      items.push(document.data() as T);
    });
    return items;
  } catch (e) {
    console.warn(`Fetch error for collection ${collectionName}:`, e);
    return [];
  }
}

// SÖZLEŞMEYİ FIRESTORE BULUTA YEDEKLE / GÜNCELLE
export async function syncContractToCloud(contract: any): Promise<boolean> {
  try {
    if (!db || !contract?.id) return false;
    const docRef = doc(collection(db, 'contracts'), contract.id);
    await setDoc(docRef, {
      ...contract,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e: any) {
    console.warn('Contract cloud sync error:', e);
    return false;
  }
}

// SÖZLEŞMEYİ FIRESTORE'DAN SİL
export async function deleteContractFromCloud(id: string): Promise<boolean> {
  try {
    if (!db || !id) return false;
    await deleteDoc(doc(db, 'contracts', id));
    return true;
  } catch (e) {
    console.warn('Contract cloud delete error:', e);
    return false;
  }
}

// PORTFÖY (PROPERTY) FIRESTORE BULUTA YEDEKLE
export async function syncPropertyToCloud(property: any): Promise<boolean> {
  try {
    if (!db || !property?.id) return false;
    const docRef = doc(collection(db, 'properties'), property.id);
    await setDoc(docRef, {
      ...property,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e: any) {
    console.warn('Property cloud sync error:', e);
    return false;
  }
}

// PORTFÖY FIRESTORE'DAN SİL
export async function deletePropertyFromCloud(id: string): Promise<boolean> {
  try {
    if (!db || !id) return false;
    await deleteDoc(doc(db, 'properties', id));
    return true;
  } catch (e) {
    console.warn('Property cloud delete error:', e);
    return false;
  }
}

// ALICI TALEBİNİ (DEMAND) FIRESTORE BULUTA YEDEKLE
export async function syncDemandToCloud(demand: any): Promise<boolean> {
  try {
    if (!db || !demand?.id) return false;
    const docRef = doc(collection(db, 'demands'), demand.id);
    await setDoc(docRef, {
      ...demand,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e: any) {
    console.warn('Demand cloud sync error:', e);
    return false;
  }
}

// ALICI TALEBİNİ FIRESTORE'DAN SİL
export async function deleteDemandFromCloud(id: string): Promise<boolean> {
  try {
    if (!db || !id) return false;
    await deleteDoc(doc(db, 'demands', id));
    return true;
  } catch (e) {
    console.warn('Demand cloud delete error:', e);
    return false;
  }
}

// OFİS / BROKER PROFİLİNİ FIRESTORE BULUTA YEDEKLE
export async function syncBrokerToCloud(broker: any): Promise<boolean> {
  try {
    if (!db) return false;
    const docId = broker?.id || 'broker_profile';
    const docRef = doc(collection(db, 'brokers'), docId);
    await setDoc(docRef, {
      ...broker,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e: any) {
    console.warn('Broker cloud sync error:', e);
    return false;
  }
}

// KULLANICI PROFİLİNİ (USER) FIRESTORE BULUTA YEDEKLE
export async function syncUserToCloud(user: any): Promise<boolean> {
  try {
    if (!db || !user?.id) return false;
    const docRef = doc(collection(db, 'users'), user.id);
    await setDoc(docRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e: any) {
    console.warn('User cloud sync error:', e);
    return false;
  }
}

// MÜŞTERİYİ (LEAD) FIRESTORE BULUTA YEDEKLE
export async function syncLeadToCloud(lead: any): Promise<boolean> {
  try {
    if (!db || !lead?.id) return false;
    const docRef = doc(collection(db, 'leads'), lead.id);
    await setDoc(docRef, {
      ...lead,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e: any) {
    console.warn('Lead cloud sync error:', e);
    return false;
  }
}

// MÜŞTERİYİ FIRESTORE'DAN SİL
export async function deleteLeadFromCloud(id: string): Promise<boolean> {
  try {
    if (!db || !id) return false;
    await deleteDoc(doc(db, 'leads', id));
    return true;
  } catch (e) {
    console.warn('Lead cloud delete error:', e);
    return false;
  }
}

// SESLİ GÖRÜŞME NOTUNU BULUTA YEDEKLE
export async function syncVoiceCrmToCloud(record: any): Promise<boolean> {
  try {
    if (!db || !record?.id) return false;
    const docRef = doc(collection(db, 'voice_crm'), record.id);
    await setDoc(docRef, {
      ...record,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e: any) {
    console.warn('Voice CRM cloud sync error:', e);
    return false;
  }
}

// SESLİ GÖRÜŞME NOTUNU FIRESTORE'DAN SİL
export async function deleteVoiceCrmFromCloud(id: string): Promise<boolean> {
  try {
    if (!db || !id) return false;
    await deleteDoc(doc(db, 'voice_crm', id));
    return true;
  } catch (e) {
    console.warn('Voice CRM cloud delete error:', e);
    return false;
  }
}

// OFİS DANIŞMANINI BULUTA YEDEKLE
export async function syncTeamAgentToCloud(agent: any): Promise<boolean> {
  try {
    if (!db || !agent?.id) return false;
    const docRef = doc(collection(db, 'team_agents'), agent.id);
    await setDoc(docRef, {
      ...agent,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e: any) {
    console.warn('Team agent cloud sync error:', e);
    return false;
  }
}

// OFİS DANIŞMANINI FIRESTORE'DAN SİL
export async function deleteTeamAgentFromCloud(id: string): Promise<boolean> {
  try {
    if (!db || !id) return false;
    await deleteDoc(doc(db, 'team_agents', id));
    return true;
  } catch (e) {
    console.warn('Team agent cloud delete error:', e);
    return false;
  }
}

// PDF DOSYASINI FIREBASE STORAGE'A YÜKLE
export async function uploadPdfToStorage(localUri: string, filename: string): Promise<string | null> {
  try {
    if (!storage) return null;
    const response = await fetch(localUri);
    const blob = await response.blob();

    const storageRef = ref(storage, `contracts/${Date.now()}_${filename}`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (e) {
    console.warn('Storage upload error:', e);
    return null;
  }
}
