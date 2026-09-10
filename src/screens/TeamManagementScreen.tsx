import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../services/storageService';
import {
  getTeamAgents,
  saveTeamAgent,
  deleteTeamAgent,
  sendWeeklyOfficeReportWhatsApp,
  TeamAgent
} from '../services/managerService';

export const TeamManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const broker = store.getBroker();
  const [agents, setAgents] = useState<TeamAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<TeamAgent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Yeni Danışman Formu
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Konut Saha Danışmanı');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    const list = await getTeamAgents();
    setAgents(list);
  };

  const handleSaveAgent = async () => {
    if (!name || !phone) {
      Alert.alert('Eksik Bilgi', 'Lütfen danışman adını ve telefon numarasını giriniz.');
      return;
    }

    await saveTeamAgent({
      name,
      title: title || 'Gayrimenkul Danışmanı',
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@ofis.com`,
      licenseNumber: licenseNumber || `${broker.licenseNumber}-0${agents.length + 1}`,
      weeklyClientsCount: 0,
      weeklyContractsCount: 0,
      activeListingsCount: 0,
      closedDealsThisMonth: 0
    });

    await loadTeam();
    setShowAddModal(false);
    setName('');
    setPhone('');
    setEmail('');
    setLicenseNumber('');
    Alert.alert('Başarılı', 'Yeni danışman ofis kadrosuna eklendi!');
  };

  const handleDeleteAgent = (id: string) => {
    Alert.alert('Danışmanı Sil', 'Bu danışmanı ofis kadrosundan çıkarmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteTeamAgent(id);
          setAgents(updated);
          if (selectedAgent?.id === id) setSelectedAgent(null);
        }
      }
    ]);
  };

  // Toplam Metrikler
  const totalWeeklyClients = agents.reduce((acc, a) => acc + a.weeklyClientsCount, 0);
  const totalWeeklyContracts = agents.reduce((acc, a) => acc + a.weeklyContractsCount, 0);
  const totalActiveListings = agents.reduce((acc, a) => acc + a.activeListingsCount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Ofis & Danışman Takibi"
        subtitle={`${broker.agencyName} Yönetici Paneli`}
        badgeText="BROKER ERP"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="person-add" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* 1. YÖNETİCİ HERO BANNER & 3 METRİK */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroSub}>OFİS HAFTALIK AKTİVİTE ÖZETİ</Text>
          <Text style={styles.heroTitle}>{broker.agencyName}</Text>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>{agents.length}</Text>
              <Text style={styles.kpiLabel}>Danışman</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>{totalWeeklyClients}</Text>
              <Text style={styles.kpiLabel}>Bu Hafta Müşteri</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>{totalWeeklyContracts}</Text>
              <Text style={styles.kpiLabel}>Sözleşme/Gösterim</Text>
            </View>
          </View>
        </View>

        {/* 2. HAFTALIK OFİS RAPORU ÜRET BUTONU */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.reportActionBtn}
          onPress={() => sendWeeklyOfficeReportWhatsApp(broker.agencyName, agents)}
        >
          <View style={styles.reportBtnIconBox}>
            <Ionicons name="document-text" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportBtnTitle}>Haftalık Yönetici Raporu Oluştur</Text>
            <Text style={styles.reportBtnSub}>Tüm ekibin aktivite ve CRM karnesini WhatsApp'a gönder</Text>
          </View>
          <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 3. DANIŞMAN LİSTESİ */}
        <Text style={styles.sectionLabel}>OFİS DANIŞMANLARI & PERFORMANS KARNESİ</Text>

        {agents.length === 0 ? (
          <View style={styles.emptyTeamCard}>
            <Ionicons name="people-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyTeamTitle}>Henüz Ekip Danışmanı Eklenmedi</Text>
            <Text style={styles.emptyTeamSub}>
              Sağ üst köşedeki '+' butonuna dokunarak danışmanlarınızı ekleyebilir, haftalık görüşme ve sözleşme karnelerini buradan takip edebilirsiniz.
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="person-add" size={17} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>İlk Danışmanı Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          agents.map((agent, index) => (
            <View key={agent.id} style={styles.agentCard}>
              <View style={styles.agentHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    {index === 0 && (
                      <View style={styles.starBadge}>
                        <Text style={styles.starText}>⭐ Lider</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.agentTitle}>{agent.title}</Text>
                  <Text style={styles.agentLicense}>Lisans No: {agent.licenseNumber}</Text>
                </View>

                <TouchableOpacity onPress={() => handleDeleteAgent(agent.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              </View>

              {/* HAFTALIK METRİKLER IZGARASI */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{agent.weeklyClientsCount}</Text>
                  <Text style={styles.metricKey}>Müşteri Teması</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{agent.weeklyContractsCount}</Text>
                  <Text style={styles.metricKey}>Sözleşme</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{agent.activeListingsCount}</Text>
                  <Text style={styles.metricKey}>Aktif Portföy</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: '#059669' }]}>{agent.closedDealsThisMonth}</Text>
                  <Text style={styles.metricKey}>Bu Ay Kapanış</Text>
                </View>
              </View>

              {/* DANIŞMAN DETAYI AÇ BUTONU */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.detailBtn}
                onPress={() => setSelectedAgent(agent)}
              >
                <Ionicons name="clipboard-outline" size={15} color={COLORS.primary} />
                <Text style={styles.detailBtnText}>
                  Müşteri Görüşme Notları & Belgeleri ({agent.notes?.length || 0})
                </Text>
                <Ionicons name="chevron-forward" size={15} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* DANIŞMAN DETAY & CRM GÖRÜŞME NOTLARI MODALI */}
      <Modal visible={!!selectedAgent} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedAgent?.name}</Text>
                <Text style={styles.modalSub}>{selectedAgent?.title} • Saha ve Müşteri Notları</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAgent(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }}>
              <Text style={styles.sectionLabel}>BU HAFTAKİ MÜŞTERİ GÖRÜŞMELERİ & SESLİ NOTLAR</Text>

              {selectedAgent?.notes && selectedAgent.notes.length > 0 ? (
                selectedAgent.notes.map(n => (
                  <View key={n.id} style={styles.crmNoteCard}>
                    <View style={styles.crmNoteHeader}>
                      <View>
                        <Text style={styles.crmClientName}>👤 {n.clientName}</Text>
                        <Text style={styles.crmProperty}>{n.propertyTitle}</Text>
                      </View>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeText}>{n.date}</Text>
                      </View>
                    </View>

                    <View style={styles.sentimentRow}>
                      <Text style={styles.sentimentLabel}>{n.sentimentLabel}</Text>
                    </View>

                    <Text style={styles.crmRawNote}>"{n.note}"</Text>

                    <View style={styles.actionItemBox}>
                      <Ionicons name="flag-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.actionItemText}>
                        <Text style={{ fontWeight: '800' }}>Danışman Aksiyonu: </Text>
                        {n.actionItem}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyNotes}>
                  <Ionicons name="chatbubbles-outline" size={36} color={COLORS.textMuted} />
                  <Text style={styles.emptyNotesText}>Bu danışmanın henüz kayıtlı CRM görüşme notu bulunmuyor.</Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* YENİ DANIŞMAN EKLEME MODALI */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ekibe Yeni Danışman Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 60 }}
            >
              <Text style={styles.fieldLabel}>Danışman Ad Soyad</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Örn: Caner İneci" />

              <Text style={styles.fieldLabel}>Uzmanlık / Unvan</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Örn: Lüks Konut Uzmanı" />

              <Text style={styles.fieldLabel}>Telefon Numarası</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="05xx xxx xx xx" keyboardType="phone-pad" />

              <Text style={styles.fieldLabel}>E-posta Adresi</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="ornek@ofis.com" keyboardType="email-address" />

              <Text style={styles.fieldLabel}>Yetki / Lisans No</Text>
              <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="3400123-04" />

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAgent}>
                <Text style={styles.modalSaveBtnText}>Danışmanı Kadroya Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: SPACING.md,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primaryGlow,
  },
  heroBanner: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.primaryGlow,
  },
  heroSub: {
    fontSize: 10,
    color: '#93C5FD',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 10,
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#BFDBFE',
    fontWeight: '700',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  reportActionBtn: {
    backgroundColor: '#059669',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  reportBtnIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBtnTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  reportBtnSub: {
    color: '#D1FAE5',
    fontSize: 10,
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  agentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  agentName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  starBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  starText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  agentTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  agentLicense: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricKey: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
  },
  detailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    marginLeft: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  crmNoteCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  crmNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  crmClientName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  crmProperty: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  dateBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateBadgeText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sentimentRow: {
    marginVertical: 4,
  },
  sentimentLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  crmRawNote: {
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 18,
    marginVertical: 4,
  },
  actionItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginTop: 6,
  },
  actionItemText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
  },
  emptyNotes: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyNotesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.text,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.primaryGlow,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyTeamCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyTeamTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  emptyTeamSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  emptyAddBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    ...SHADOWS.primaryGlow,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
