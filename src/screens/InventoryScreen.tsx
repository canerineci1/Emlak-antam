import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { InventoryReportData, InventoryItem, generateAndShareInventoryPdf } from '../services/inventoryService';
import { Ionicons } from '@expo/vector-icons';

export const InventoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const properties = store.getProperties();
  const broker = store.getBroker();

  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [landlordName, setLandlordName] = useState('Mülk Sahibi');

  // Sayaçlar
  const [elecNo, setElecNo] = useState('');
  const [elecReading, setElecReading] = useState('');
  const [waterNo, setWaterNo] = useState('');
  const [waterReading, setWaterReading] = useState('');
  const [gasNo, setGasNo] = useState('');
  const [gasReading, setGasReading] = useState('');

  // Anahtar ve Boya
  const [keyMain, setKeyMain] = useState('2');
  const [keyBackup, setKeyBackup] = useState('1');
  const [paintCond, setPaintCond] = useState<'YENİ_BOYALI' | 'BOYA_GEREKLİ' | 'ORTA'>('YENİ_BOYALI');

  // Demirbaşlar
  const [items, setItems] = useState<InventoryItem[]>([
    { id: '1', name: 'Kombi / Şofben', status: 'EKSİKSİZ', notes: 'Çalışır vaziyette' },
    { id: '2', name: 'Klima & Kumanda', status: 'EKSİKSİZ', notes: 'Gazı tam, çalışıyor' },
    { id: '3', name: 'Ankastre Set (Fırın/Ocak/Davlumbaz)', status: 'EKSİKSİZ', notes: 'Temiz ve sağlam' },
    { id: '4', name: 'Görüntülü Diafon', status: 'EKSİKSİZ', notes: 'Aktif' },
  ]);

  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  const toggleItemStatus = (id: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'EKSİKSİZ' ? 'HASARLI' : item.status === 'HASARLI' ? 'YOK' : 'EKSİKSİZ';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleGenerateReport = async () => {
    if (!tenantName.trim() || !tenantPhone.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen kiracı adını ve telefonunu giriniz.');
      return;
    }

    const prop = properties.find(p => p.id === selectedPropId) || properties[0];

    const now = new Date();
    const deliveryDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

    const reportData: InventoryReportData = {
      id: `inv_${Date.now()}`,
      property: prop,
      broker,
      tenant: { name: tenantName, phone: tenantPhone },
      landlord: { name: landlordName || prop.ownerName || 'Mülk Sahibi', phone: prop.ownerPhone || '-' },
      deliveryDate,
      electricityMeter: { meterNumber: elecNo, lastReading: elecReading },
      waterMeter: { meterNumber: waterNo, lastReading: waterReading },
      gasMeter: { meterNumber: gasNo, lastReading: gasReading },
      keyCountMain: keyMain,
      keyCountBackup: keyBackup,
      paintCondition: paintCond,
      items,
      generalNotes: notes,
    };

    setGenerating(true);
    try {
      await generateAndShareInventoryPdf(reportData);
    } catch (error) {
      Alert.alert('Hata', 'Teslim tutanağı oluşturulurken bir sorun oluştu.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Demirbaş & Sayaç Tutanağı"
        subtitle="Mülk Teslim Anı Durum Tespiti"
        badgeText="TESLİM TUTANAĞI"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollPadding, { paddingBottom: 160 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* 1. Taşınmaz Seçimi */}
        <Text style={styles.sectionLabel}>1. TESLİM EDİLEN TAŞINMAZ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propScroll}>
          {properties.map(p => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.8}
              style={[styles.propChip, selectedPropId === p.id && styles.propChipActive]}
              onPress={() => setSelectedPropId(p.id)}
            >
              <Text style={[styles.propChipText, selectedPropId === p.id && styles.propChipTextActive]}>
                {p.district} • {p.rooms || 'Daire'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2. Kiracı Bilgileri */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>2. TESLİM ALAN KİRACI</Text>
        <View style={styles.card}>
          <View style={styles.rowInputs}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Kiracı Ad Soyad *</Text>
              <TextInput
                style={styles.textInput}
                value={tenantName}
                onChangeText={setTenantName}
                placeholder="Örn: Caner İneci"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Kiracı Telefon *</Text>
              <TextInput
                style={styles.textInput}
                value={tenantPhone}
                onChangeText={setTenantPhone}
                keyboardType="phone-pad"
                placeholder="0532 123 45 67"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        {/* 3. Sayaç Endeksleri */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>3. TESLİM ANI SAYAÇ ENDEKSLERİ</Text>
        <View style={styles.card}>
          <View style={styles.meterRow}>
            <Ionicons name="flash-outline" size={18} color="#EAB308" />
            <Text style={styles.meterName}>Elektrik</Text>
            <TextInput
              style={styles.meterInput}
              placeholder="Sayaç No"
              placeholderTextColor={COLORS.textMuted}
              value={elecNo}
              onChangeText={setElecNo}
            />
            <TextInput
              style={styles.meterInput}
              placeholder="Son Endeks"
              placeholderTextColor={COLORS.textMuted}
              value={elecReading}
              onChangeText={setElecReading}
            />
          </View>

          <View style={styles.meterRow}>
            <Ionicons name="water-outline" size={18} color="#0284C7" />
            <Text style={styles.meterName}>Su</Text>
            <TextInput
              style={styles.meterInput}
              placeholder="Sayaç No"
              placeholderTextColor={COLORS.textMuted}
              value={waterNo}
              onChangeText={setWaterNo}
            />
            <TextInput
              style={styles.meterInput}
              placeholder="Son Endeks"
              placeholderTextColor={COLORS.textMuted}
              value={waterReading}
              onChangeText={setWaterReading}
            />
          </View>

          <View style={[styles.meterRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="flame-outline" size={18} color="#EA580C" />
            <Text style={styles.meterName}>Doğalgaz</Text>
            <TextInput
              style={styles.meterInput}
              placeholder="Sayaç No"
              placeholderTextColor={COLORS.textMuted}
              value={gasNo}
              onChangeText={setGasNo}
            />
            <TextInput
              style={styles.meterInput}
              placeholder="Son Endeks"
              placeholderTextColor={COLORS.textMuted}
              value={gasReading}
              onChangeText={setGasReading}
            />
          </View>
        </View>

        {/* 4. Demirbaş Listesi */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>4. DEMİRBAŞ DURUMLARI (DOKUNUP DEĞİŞTİRİN)</Text>
        <View style={styles.card}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => toggleItemStatus(item.id)}
            >
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={[
                styles.statusBadge,
                item.status === 'EKSİKSİZ' ? styles.statusOk : item.status === 'HASARLI' ? styles.statusDamaged : styles.statusMissing
              ]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. Anahtar ve Boya Durumu */}
        <View style={styles.card}>
          <View style={styles.rowInputs}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Asıl Anahtar</Text>
              <TextInput style={styles.textInput} value={keyMain} onChangeText={setKeyMain} keyboardType="numeric" />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Yedek Anahtar</Text>
              <TextInput style={styles.textInput} value={keyBackup} onChangeText={setKeyBackup} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* PDF Üret ve Paylaş */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.generateBtn}
          onPress={handleGenerateReport}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="document-text" size={18} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>Demirbaş Tutanağı PDF Üret & Paylaş</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  propScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  propChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
    ...SHADOWS.sm,
  },
  propChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  propChipText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  propChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroup: {
    marginBottom: SPACING.xs,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  meterName: {
    width: 65,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  meterInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusOk: {
    backgroundColor: COLORS.accentLight,
  },
  statusDamaged: {
    backgroundColor: COLORS.amberLight,
  },
  statusMissing: {
    backgroundColor: COLORS.dangerLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  generateBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.xs,
    ...SHADOWS.primaryGlow,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
