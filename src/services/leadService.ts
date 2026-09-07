import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Alert } from 'react-native';
import { syncLeadToCloud, deleteLeadFromCloud, fetchCollectionFromCloud } from './firebaseSyncService';

export type ClientRole = 'ALICI' | 'KIRACI' | 'MALIK' | 'YATIRIMCI';

export interface LeadClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tcNo?: string;
  role: ClientRole;
  targetDistrict: string;
  maxBudget: string;
  rooms?: string;
  status: 'SICAK' | 'ILGILENIYOR' | 'BEKLEMEDE' | 'ISLEM_TAMAM';
  notes: string;
  createdAt: string;
}

const LEADS_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_leads.json';

// Gerçek Müşteri Listesi (Sıfır Mock Veri)
let memoryLeads: LeadClient[] = [];

// Tüm Müşterileri Getir (Cihaz Önbelleği + Canlı Firestore)
export async function getLeads(): Promise<LeadClient[]> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(LEADS_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(LEADS_FILE, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryLeads = parsed;
      }
    }

    // Canlı Firestore Bulutundan Çek
    const cloudLeads = await fetchCollectionFromCloud<LeadClient>('leads');
    if (cloudLeads && cloudLeads.length > 0) {
      const map = new Map<string, LeadClient>();
      memoryLeads.forEach(l => map.set(l.id, l));
      cloudLeads.forEach(l => map.set(l.id, l));
      memoryLeads = Array.from(map.values()).sort((a, b) => (b.id > a.id ? 1 : -1));

      await FileSystem.writeAsStringAsync(LEADS_FILE, JSON.stringify(memoryLeads, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    }
  } catch (e) {
    console.warn('Leads read error', e);
  }
  return memoryLeads;
}

// Yeni Müşteriyi Kaydet (Cihaz + Canlı Firestore)
export async function saveLead(lead: Omit<LeadClient, 'id' | 'createdAt'>): Promise<LeadClient> {
  const newLead: LeadClient = {
    ...lead,
    id: 'lead-' + Date.now(),
    createdAt: new Date().toLocaleDateString('tr-TR')
  };

  memoryLeads = [newLead, ...memoryLeads];

  try {
    await FileSystem.writeAsStringAsync(LEADS_FILE, JSON.stringify(memoryLeads, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });
  } catch (e) {
    console.warn('Leads write error', e);
  }

  // Firestore Bulutuna Canlı Gönder
  syncLeadToCloud(newLead);

  return newLead;
}

// Müşteriyi Sil (Cihaz + Canlı Firestore)
export async function deleteLead(id: string): Promise<LeadClient[]> {
  memoryLeads = memoryLeads.filter(l => l.id !== id);
  try {
    await FileSystem.writeAsStringAsync(LEADS_FILE, JSON.stringify(memoryLeads, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });
  } catch (e) {
    console.warn('Leads delete error', e);
  }

  // Firestore Bulutundan Canlı Sil
  deleteLeadFromCloud(id);

  return memoryLeads;
}

export function callLeadPhone(phone: string) {
  const clean = phone.replace(/[^0-9]/g, '');
  Linking.openURL(`tel:${clean}`);
}

export function openLeadWhatsApp(phone: string, clientName: string) {
  const clean = phone.replace(/[^0-9]/g, '');
  const msg = `Merhaba ${clientName} Bey/Hanım,\n\nEmlakÇantam üzerinden aradığınız portföy kriterlerinizle ilgili size ulaşmaktayım. Müsait olduğunuzda görüşebilir miyiz?`;
  const url = `whatsapp://send?phone=${clean.startsWith('0') ? '9' + clean : clean.startsWith('90') ? clean : '90' + clean}&text=${encodeURIComponent(msg)}`;
  
  Linking.canOpenURL(url).then(supported => {
    if (supported) Linking.openURL(url);
    else Alert.alert('WhatsApp Bulunamadı', 'Cihazınızda WhatsApp uygulaması bulunamadı.');
  });
}
