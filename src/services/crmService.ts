import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Alert } from 'react-native';
import { syncVoiceCrmToCloud, deleteVoiceCrmFromCloud, fetchCollectionFromCloud } from './firebaseSyncService';

export interface VoiceCrmRecord {
  id: string;
  clientName: string;
  propertyTitle: string;
  sentiment: 'OLUMSUZ' | 'OLUMLU' | 'KARARSIZ';
  sentimentLabel: string;
  financialNote: string;
  rawTranscript: string;
  reportSummary: string;
  createdAt: string;
}

const CRM_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_voice_crm.json';

// Gerçek CRM Kayıt Hafızası (Sıfır Mock Veri)
let memoryRecords: VoiceCrmRecord[] = [];

// Tüm CRM Kayıtlarını Getir (Cihaz Önbelleği + Canlı Firestore)
export async function getVoiceCrmRecords(): Promise<VoiceCrmRecord[]> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(CRM_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(CRM_FILE, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryRecords = parsed;
      }
    }

    // Canlı Firestore Bulutundan Çek
    const cloudRecords = await fetchCollectionFromCloud<VoiceCrmRecord>('voice_crm');
    if (cloudRecords && cloudRecords.length > 0) {
      const map = new Map<string, VoiceCrmRecord>();
      memoryRecords.forEach(r => map.set(r.id, r));
      cloudRecords.forEach(r => map.set(r.id, r));
      memoryRecords = Array.from(map.values()).sort((a, b) => (b.id > a.id ? 1 : -1));

      await FileSystem.writeAsStringAsync(CRM_FILE, JSON.stringify(memoryRecords, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    }
  } catch (e) {
    console.warn('CRM read error', e);
  }
  return memoryRecords;
}

// Yeni Görüşme Raporunu CRM'e Kaydet (Cihaz + Canlı Firestore)
export async function saveVoiceCrmRecord(record: Omit<VoiceCrmRecord, 'id' | 'createdAt'>): Promise<VoiceCrmRecord> {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newRecord: VoiceCrmRecord = {
    ...record,
    id: 'crm-' + Date.now(),
    createdAt: dateStr
  };

  memoryRecords = [newRecord, ...memoryRecords];

  try {
    await FileSystem.writeAsStringAsync(CRM_FILE, JSON.stringify(memoryRecords, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });
  } catch (e) {
    console.warn('CRM write error', e);
  }

  // Firestore Bulutuna Canlı Gönder
  syncVoiceCrmToCloud(newRecord);

  return newRecord;
}

// CRM Kaydını Sil (Cihaz + Canlı Firestore)
export async function deleteVoiceCrmRecord(id: string): Promise<VoiceCrmRecord[]> {
  memoryRecords = memoryRecords.filter(r => r.id !== id);
  try {
    await FileSystem.writeAsStringAsync(CRM_FILE, JSON.stringify(memoryRecords, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });
  } catch (e) {
    console.warn('CRM delete error', e);
  }

  // Firestore Bulutundan Canlı Sil
  deleteVoiceCrmFromCloud(id);

  return memoryRecords;
}

// WhatsApp İle Paylaş (Mülk Sahibine veya Yöneticiye Rapor Gönder)
export function shareCrmReportViaWhatsApp(record: VoiceCrmRecord, phone?: string) {
  const message = `*EMLAKÇANTAM SAHA GÖRÜŞME RAPORU*\n\n${record.reportSummary}\n\n_EmlakÇantam Mobil CRM ile oluşturuldu._`;
  const url = phone 
    ? `whatsapp://send?phone=${phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(message)}`
    : `whatsapp://send?text=${encodeURIComponent(message)}`;

  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp Bulunamadı', 'Cihazınızda WhatsApp uygulaması yüklü değil veya açılamadı.');
    }
  });
}
