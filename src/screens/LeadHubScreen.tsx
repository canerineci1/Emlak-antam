import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { getLeads, saveLead, deleteLead, callLeadPhone, openLeadWhatsApp, LeadClient, ClientRole } from '../services/leadService';

export const LeadHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [leads, setLeads] = useState<LeadClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'TUMU' | ClientRole>('TUMU');
  const [showAddModal, setShowAddModal] = useState(false);

  // Yeni Müşteri Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<ClientRole>('ALICI');
  const [targetDistrict, setTargetDistrict] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [rooms, setRooms] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const list = await getLeads();
    setLeads(list);
  };

  const handleSaveLead = async () => {
    if (!name || !phone) {
      Alert.alert('Eksik Bilgi', 'Lütfen müşteri adı ve telefon numarasını giriniz.');
      return;
    }

    await saveLead({
      name,
      phone,
      role,
      targetDistrict: targetDistrict || 'Belirtilmedi',
      maxBudget: maxBudget || 'Belirtilmedi',
      rooms: rooms || 'Farketmez',
      status: 'SICAK',
      notes: notes || 'Yeni müşteri kaydı.'
    });

    await loadLeads();
    setShowAddModal(false);
    setName('');
    setPhone('');
    setTargetDistrict('');
    setMaxBudget('');
    setRooms('');
    setNotes('');
    Alert.alert('Başarılı', 'Müşteri başarıyla CRM rehberine eklendi!');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Müşteriyi Sil', 'Bu müşteriyi rehberden silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteLead(id);
          setLeads(updated);
        }
      }
    ]);
  };

  const filteredLeads = leads.filter(l => {
    const matchesRole = selectedRole === 'TUMU' || l.role === selectedRole;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.targetDistrict.toLowerCase().includes(q);

    return matchesRole && matchesQuery;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Müşteri Rehberi & CRM"
        subtitle="Alıcı, Kiracı ve Malik Portföy Havuzu"
        badgeText="LEAD HUB"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="person-add" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* ARAMA VE FİLTRE ÇUBUĞU */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="İsim, telefon veya bölge ara..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ROL FİLTRE ÇİPLERİ */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterScroll}>
        {(['TUMU', 'ALICI', 'KIRACI', 'MALIK', 'YATIRIMCI'] as const).map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.roleChip, selectedRole === r && styles.roleChipActive]}
            onPress={() => setSelectedRole(r)}
          >
            <Text style={[styles.roleChipText, selectedRole === r && styles.roleChipTextActive]}>
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* MÜŞTERİ KARTLARI LİSTESİ */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <Text style={styles.sectionLabel}>MÜŞTERİ LİSTESİ ({filteredLeads.length})</Text>

        {filteredLeads.map(item => (
          <View key={item.id} style={styles.leadCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.leadName}>{item.name}</Text>
                <Text style={styles.leadPhone}>{item.phone}</Text>
              </View>

              <View style={[
                styles.roleBadge,
                item.role === 'ALICI' ? styles.badgeBlue :
                item.role === 'KIRACI' ? styles.badgeGreen :
                item.role === 'MALIK' ? styles.badgePurple : styles.badgeAmber
              ]}>
                <Text style={styles.roleBadgeText}>{item.role}</Text>
              </View>
            </View>

            <View style={styles.detailBox}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>Aradığı Bölge: <Text style={{ fontWeight: '700' }}>{item.targetDistrict}</Text></Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>Bütçe / Oda: <Text style={{ fontWeight: '700' }}>{item.maxBudget} • {item.rooms}</Text></Text>
              </View>

              {item.notes ? (
                <Text style={styles.notesText}>📝 {item.notes}</Text>
              ) : null}
            </View>

            {/* HIZLI AKSİYONLAR (ARA, WHATSAPP, SİL) */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtnCall}
                onPress={() => callLeadPhone(item.phone)}
              >
                <Ionicons name="call" size={14} color={COLORS.primary} />
                <Text style={styles.btnTextCall}>Ara</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnWa}
                onPress={() => openLeadWhatsApp(item.phone, item.name)}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#059669" />
                <Text style={styles.btnTextWa}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnDel}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredLeads.length === 0 && (
          <View style={styles.emptyLeadCard}>
            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyLeadTitle}>
              {leads.length === 0 ? "Henüz Müşteri Kaydı Bulunmuyor" : "Aramaya Uygun Müşteri Bulunamadı"}
            </Text>
            <Text style={styles.emptyLeadSub}>
              {leads.length === 0 
                ? "Sağ üstteki '+' simgesine dokunarak ilk alıcı, kiracı veya mülk sahibi müşterinizi CRM rehberine ekleyin."
                : "Arama filtrenizi temizleyin veya yeni bir müşteri ekleyin."}
            </Text>
            {leads.length === 0 && (
              <TouchableOpacity 
                style={styles.emptyAddBtn}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="person-add" size={17} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>İlk Müşteriyi Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* YENİ MÜŞTERİ EKLEME MODALI */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Müşteri Tanımla</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Müşteri Ad Soyad</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Örn: Caner İneci" />

              <Text style={styles.fieldLabel}>Telefon Numarası</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="05xx xxx xx xx" keyboardType="phone-pad" />

              <Text style={styles.fieldLabel}>Müşteri Rolü</Text>
              <View style={styles.rolePickerRow}>
                {(['ALICI', 'KIRACI', 'MALIK', 'YATIRIMCI'] as const).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.pickerChip, role === r && styles.pickerChipActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.pickerChipText, role === r && styles.pickerChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Aradığı Bölge</Text>
              <TextInput style={styles.input} value={targetDistrict} onChangeText={setTargetDistrict} placeholder="Örn: Kadıköy Moda" />

              <Text style={styles.fieldLabel}>Maksimum Bütçe & Oda</Text>
              <TextInput style={styles.input} value={maxBudget} onChangeText={setMaxBudget} placeholder="Örn: 15.000.000 TL" />

              <Text style={styles.fieldLabel}>Notlar & Özel Talepler</Text>
              <TextInput style={[styles.input, { minHeight: 60 }]} value={notes} onChangeText={setNotes} placeholder="Müşterinin özel kriterleri..." multiline />

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveLead}>
                <Text style={styles.modalSaveBtnText}>Müşteriyi Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primaryGlow,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  roleFilterScroll: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    maxHeight: 38,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  roleChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: SPACING.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  leadCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  leadPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeBlue: { backgroundColor: '#DBEAFE' },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgePurple: { backgroundColor: '#EDE9FE' },
  badgeAmber: { backgroundColor: '#FEF3C7' },
  detailBox: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginVertical: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.text,
  },
  notesText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    gap: 5,
  },
  btnTextCall: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionBtnWa: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 5,
  },
  btnTextWa: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  actionBtnDel: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
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
  rolePickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  pickerChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  pickerChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pickerChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  pickerChipTextActive: {
    color: COLORS.primary,
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
  emptyLeadCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyLeadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  emptyLeadSub: {
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
