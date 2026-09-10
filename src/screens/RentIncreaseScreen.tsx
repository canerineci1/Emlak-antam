import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { calculateRentIncrease, buildRentIncreaseWhatsAppText } from '../services/rentIncreaseService';
import { Ionicons } from '@expo/vector-icons';

export const RentIncreaseScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const properties = store.getProperties();

  const [currentRentStr, setCurrentRentStr] = useState('25000');
  const [tufeRateStr, setTufeRateStr] = useState('60.45');
  const [tenantName, setTenantName] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [selectedPropId, setSelectedPropId] = useState<string>('');

  const currentRent = parseFloat(currentRentStr.replace(/\./g, '').replace(/,/g, '')) || 0;
  const tufeRate = parseFloat(tufeRateStr.replace(',', '.')) || 0;

  const result = calculateRentIncrease({
    currentRent,
    tufeRate,
    tenantName,
    landlordName,
    propertyTitle: properties.find(p => p.id === selectedPropId)?.title,
  });

  const handleSelectProperty = (propId: string) => {
    setSelectedPropId(propId);
    const found = properties.find(p => p.id === propId);
    if (found) {
      if (found.ownerName) setLandlordName(found.ownerName);
      if (found.type === 'KIRALIK') {
        const num = found.price.replace(/\./g, '').replace(/,/g, '');
        setCurrentRentStr(num);
      }
    }
  };

  const handleSendWhatsApp = (target: 'TENANT' | 'LANDLORD') => {
    const selectedProp = properties.find(p => p.id === selectedPropId);
    const msg = buildRentIncreaseWhatsAppText(
      {
        currentRent,
        tufeRate,
        tenantName,
        landlordName,
        propertyTitle: selectedProp?.title,
      },
      result,
      target
    );

    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Bilgi', 'WhatsApp açılamadı.');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Yasal Kira Artış Motoru"
        subtitle="TBK Madde 344 & TÜİK 12 Aylık TÜFE Tavan Hesabı"
        badgeText="YASAL TAVAN"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* Portföy Seçimi */}
        <Text style={styles.sectionLabel}>KİRALIK PORTFÖYDEN SEÇ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propScroll}>
          {properties.map(p => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.8}
              style={[styles.propChip, selectedPropId === p.id && styles.propChipActive]}
              onPress={() => handleSelectProperty(p.id)}
            >
              <Text style={[styles.propChipText, selectedPropId === p.id && styles.propChipTextActive]}>
                {p.district} • {p.price} TL
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Giriş Alanları */}
        <View style={styles.inputCard}>
          <View style={styles.rowInputs}>
            <View style={[styles.fieldGroup, { flex: 1.2 }]}>
              <Text style={styles.inputLabel}>Mevcut Kira Bedeli (TL) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={currentRentStr}
                onChangeText={setCurrentRentStr}
                placeholder="25000"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>TÜİK TÜFE Oranı % *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                value={tufeRateStr}
                onChangeText={setTufeRateStr}
                placeholder="60.45"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Hızlı TÜFE Butonları */}
          <View style={styles.quickRatesRow}>
            {['55.90', '59.80', '60.45', '62.10'].map(rate => (
              <TouchableOpacity
                key={rate}
                style={[styles.quickRateBtn, tufeRateStr === rate && styles.quickRateBtnActive]}
                onPress={() => setTufeRateStr(rate)}
              >
                <Text style={[styles.quickRateText, tufeRateStr === rate && styles.quickRateTextActive]}>%{rate}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Kiracı Adı</Text>
              <TextInput
                style={styles.textInput}
                value={tenantName}
                onChangeText={setTenantName}
                placeholder="Örn: Kemal Bey"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Mülk Sahibi Adı</Text>
              <TextInput
                style={styles.textInput}
                value={landlordName}
                onChangeText={setLandlordName}
                placeholder="Örn: Ayşe Hanım"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        {/* SONUÇ KARTI: YENİ YASAL KİRA HERO */}
        <View style={styles.heroRentBanner}>
          <Text style={styles.heroRentLabel}>YENİ DÖNEM YASAL KİRA BEDELİ</Text>
          <Text style={styles.heroRentVal}>{result.newRent.toLocaleString('tr-TR')} TL</Text>
          <Text style={styles.heroRentSub}>
            Net Artış Tutarı: +{result.increaseAmount.toLocaleString('tr-TR')} TL (%{result.tufeRate} Yasal Tavan)
          </Text>
        </View>

        {/* Yasal Hüküm Bilgi Kartı */}
        <View style={styles.legalInfoCard}>
          <Ionicons name="scale-outline" size={20} color={COLORS.primary} />
          <Text style={styles.legalInfoText}>
            6098 sayılı Türk Borçlar Kanunu Madde 344 uyarınca konut ve işyerlerinde kira artış tavanı bir önceki kira yılının tüketici fiyat endeksindeki (TÜFE) on iki aylık ortalamalara göre değişim oranını geçemez.
          </Text>
        </View>

        {/* WHATSAPP BİLDİRİM BUTONLARI */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>RESMİ BİLDİRİM MESAJI GÖNDER</Text>
        
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.whatsappTenantBtn}
          onPress={() => handleSendWhatsApp('TENANT')}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.whatsappBtnText}>Kiracıya Yasal Artış Bildirimi Gönder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.whatsappLandlordBtn}
          onPress={() => handleSendWhatsApp('LANDLORD')}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.whatsappBtnText}>Ev Sahibine Yasal Hesap Raporu Gönder</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  inputCard: {
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
    marginBottom: SPACING.xs,
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
  quickRatesRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
  },
  quickRateBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  quickRateBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  quickRateText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quickRateTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  heroRentBanner: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  heroRentLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroRentVal: {
    color: '#38BDF8',
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  heroRentSub: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  legalInfoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
    gap: 10,
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  legalInfoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primaryDark,
    lineHeight: 16,
    fontWeight: '500',
  },
  whatsappTenantBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  whatsappLandlordBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.primaryGlow,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
