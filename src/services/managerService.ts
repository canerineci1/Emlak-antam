import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Alert } from 'react-native';
import { syncTeamAgentToCloud, deleteTeamAgentFromCloud, fetchCollectionFromCloud } from './firebaseSyncService';

export interface AgentCrmNote {
  id: string;
  clientName: string;
  propertyTitle: string;
  date: string;
  sentiment: 'OLUMSUZ' | 'OLUMLU' | 'KARARSIZ';
  sentimentLabel: string;
  note: string;
  actionItem: string;
}

export interface TeamAgent {
  id: string;
  name: string;
  title: string;          // Örn: "Lüks Konut Uzmanı", "Saha Danışmanı", "Arsa/Ticari Uzmanı"
  phone: string;
  email: string;
  licenseNumber: string;
  weeklyClientsCount: number;   // Bu hafta ilgilendiği müşteri sayısı
  weeklyContractsCount: number; // Bu hafta düzenlediği yer gösterme / sözleşme
  activeListingsCount: number;  // Aktif portföy sayısı
  closedDealsThisMonth: number; // Bu ay bağlanan tapu / kapora
  notes: AgentCrmNote[];
}

const TEAM_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_team.json';

// Gerçek Ekip Danışman Listesi (Sıfır Mock Veri)
let memoryTeam: TeamAgent[] = [];

// Tüm Danışmanları Getir (Cihaz Önbelleği + Canlı Firestore)
export async function getTeamAgents(): Promise<TeamAgent[]> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(TEAM_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(TEAM_FILE, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryTeam = parsed;
      }
    }

    // Canlı Firestore Bulutundan Çek
    const cloudAgents = await fetchCollectionFromCloud<TeamAgent>('team_agents');
    if (cloudAgents && cloudAgents.length > 0) {
      const map = new Map<string, TeamAgent>();
      memoryTeam.forEach(a => map.set(a.id, a));
      cloudAgents.forEach(a => map.set(a.id, a));
      memoryTeam = Array.from(map.values()).sort((a, b) => (b.id > a.id ? 1 : -1));

      await FileSystem.writeAsStringAsync(TEAM_FILE, JSON.stringify(memoryTeam, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    }
  } catch (e) {
    console.warn('Team read error', e);
  }
  return memoryTeam;
}

// Yeni Danışman Ekle (Cihaz + Canlı Firestore)
export async function saveTeamAgent(agent: Omit<TeamAgent, 'id' | 'notes'>): Promise<TeamAgent> {
  const newAgent: TeamAgent = {
    ...agent,
    id: 'agent-' + Date.now(),
    notes: []
  };

  memoryTeam = [...memoryTeam, newAgent];

  try {
    await FileSystem.writeAsStringAsync(TEAM_FILE, JSON.stringify(memoryTeam, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });
  } catch (e) {
    console.warn('Team write error', e);
  }

  // Firestore Bulutuna Canlı Gönder
  syncTeamAgentToCloud(newAgent);

  return newAgent;
}

// Danışmanı Sil (Cihaz + Canlı Firestore)
export async function deleteTeamAgent(id: string): Promise<TeamAgent[]> {
  memoryTeam = memoryTeam.filter(a => a.id !== id);
  try {
    await FileSystem.writeAsStringAsync(TEAM_FILE, JSON.stringify(memoryTeam, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });
  } catch (e) {
    console.warn('Team delete error', e);
  }

  // Firestore Bulutundan Canlı Sil
  deleteTeamAgentFromCloud(id);

  return memoryTeam;
}

// HAFTALIK YÖNETİCİ & BROKER RAPORU METNİ OLUŞTURUCU (WHATSAPP & BÜLTEN)
export function generateWeeklyOfficeReportText(agencyName: string, agents: TeamAgent[]): string {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

  let report = `🏢 *${(agencyName || 'EMLAKOFİSİM').toUpperCase()} - HAFTALIK OFİS & DANIŞMAN RAPORU*\n`;
  report += `📅 *Rapor Tarihi:* ${dateStr}\n`;
  report += `────────────────────────────\n\n`;

  if (!agents || agents.length === 0) {
    report += `ℹ️ *Henüz ofise kayıtlı danışman bulunmuyor.*\n`;
    report += `Danışmanlarınızı sisteme ekleyerek haftalık karnelerini buradan anlık olarak takip edebilirsiniz.\n\n`;
    report += `────────────────────────────\n`;
    report += `_EmlakÇantam Broker ERP Sistemi ile oluşturulmuştur._`;
    return report;
  }

  const totalClients = agents.reduce((acc, a) => acc + (a.weeklyClientsCount || 0), 0);
  const totalContracts = agents.reduce((acc, a) => acc + (a.weeklyContractsCount || 0), 0);
  const totalListings = agents.reduce((acc, a) => acc + (a.activeListingsCount || 0), 0);
  const totalDeals = agents.reduce((acc, a) => acc + (a.closedDealsThisMonth || 0), 0);

  // Haftanın Yıldızı (En çok müşteri ve sözleşme yapan)
  const sorted = [...agents].sort((a, b) => ((b.weeklyClientsCount || 0) + (b.weeklyContractsCount || 0)) - ((a.weeklyClientsCount || 0) + (a.weeklyContractsCount || 0)));
  const starAgent = sorted[0];

  report += `📊 *GENEL OFİS AKTİVİTE KARNESİ:*\n`;
  report += `• 👥 Aktif Danışman Sayısı: *${agents.length} Danışman*\n`;
  report += `• 👤 Bu Hafta İlgilenilen Müşteri: *${totalClients} Müşteri*\n`;
  report += `• 📄 Düzenlenen Sözleşme/Yer Gösterme: *${totalContracts} Adet*\n`;
  report += `• 🏠 Yönetilen Aktif Portföy: *${totalListings} Taşınmaz*\n`;
  report += `• 💰 Bu Ay Kapanan İşlem/Kapora: *${totalDeals} İşlem*\n\n`;

  if (starAgent && ((starAgent.weeklyClientsCount || 0) > 0 || (starAgent.weeklyContractsCount || 0) > 0)) {
    report += `⭐ *HAFTANIN YILDIZ DANIŞMANI:* *${starAgent.name}*\n`;
    report += `_${starAgent.weeklyClientsCount || 0} müşteri teması ve ${starAgent.weeklyContractsCount || 0} sözleşme ile ofis lideri._\n\n`;
  }

  report += `📋 *DANIŞMAN BAZLI HAFTALIK PERFORMANS:*\n`;
  agents.forEach((a, idx) => {
    report += `*${idx + 1}. ${a.name}* (${a.title})\n`;
    report += `   • Müşteri: ${a.weeklyClientsCount || 0} | Sözleşme: ${a.weeklyContractsCount || 0} | Portföy: ${a.activeListingsCount || 0}\n`;
    if (a.notes && a.notes.length > 0) {
      report += `   • 📝 Son CRM Notu: "${a.notes[0].note.slice(0, 70)}..."\n`;
    }
    report += `\n`;
  });

  report += `────────────────────────────\n`;
  report += `_EmlakÇantam Broker ERP Sistemi ile otomatik oluşturulmuştur._`;

  return report;
}

export function sendWeeklyOfficeReportWhatsApp(agencyName: string, agents: TeamAgent[]) {
  const text = generateWeeklyOfficeReportText(agencyName, agents);
  const url = `whatsapp://send?text=${encodeURIComponent(text)}`;

  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp Açılamadı', 'Cihazınızda WhatsApp yüklü değil veya açılamadı.');
    }
  });
}
