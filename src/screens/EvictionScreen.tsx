import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { validateEvictionDates, generateEvictionPdf, EvictionData } from '../services/evictionService';

export const EvictionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // Form State
  const [landlordName, setLandlordName] = useState('');
  const [landlordTc, setLandlordTc] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantTc, setTenantTc] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  
  // Yasal Tarihler (GG.AA.YYYY)
  const now = new Date();
  const currentYear = now.getFullYear();
  const [leaseStartDate, setLeaseStartDate] = useState(`01.01.${currentYear}`);
  const [commitmentDate, setCommitmentDate] = useState(`15.01.${currentYear}`); // Kira başlangıcından sonra!
  const [evictionDate, setEvictionDate] = useState(`01.01.${currentYear + 1}`);
  const [penaltyPerDay, setPenaltyPerDay] = useState('2.500');

  // Eş / Kefil Muvafakati
  const [hasGuarantorConsent, setHasGuarantorConsent] = useState(false);
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorTc, setGuarantorTc] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  // Anlık Yargıtay Hukuk Kuralı Doğrulayıcısı
  const dateValidation = validateEvictionDates(leaseStartDate, commitmentDate, evictionDate);

  const handleGeneratePdf = async () => {
    if (!dateValidation.isValid) {
      Alert.alert('Hukuki Hata', dateValidation.message);
      return;
    }

    if (!tenantName || !tenantTc || !landlordName || !propertyAddress) {
      Alert.alert('Eksik Bilgi', 'Lütfen kiracı, malik ve adres bilgilerini eksiksiz doldurunuz.');
      return;
    }

    setIsGenerating(true);
    try {
      const data: EvictionData = {
        id: 'evict-' + Date.now(),
        landlordName,
        landlordTc,
        tenantName,
        tenantTc,
        tenantPhone,
        propertyAddress,
        leaseStartDate,
        commitmentDate,
        evictionDate,
        penaltyPerDay,
        hasGuarantorConsent,
        guarantorName,
        guarantorTc
      };

      await generateEvictionPdf(data);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'PDF oluşturulamadı.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Tahliye Taahhütnamesi"
        subtitle="TBK m. 352 & Yargıtay İçtihadı Uyumlu"
        badgeText="YASAL BELGE"
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
        {/* YARGITAY UYUM BANNERI */}
        <View style={[styles.legalBanner, dateValidation.isValid ? styles.bannerGreen : styles.bannerRed]}>
          <Ionicons
            name={dateValidation.isValid ? "shield-checkmark" : "warning"}
            size={18}
            color={dateValidation.isValid ? "#059669" : "#DC2626"}
          />
          <Text style={[styles.legalBannerText, dateValidation.isValid ? styles.textGreen : styles.textRed]}>
            {dateValidation.message}
          </Text>
        </View>

        {/* 1. KİRACI VE MALİK BİLGİLERİ */}
        <Text style={styles.sectionLabel}>1. TARAFLARIN BİLGİLERİ</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Kiraya Veren (Malik) Ad Soyad</Text>
          <TextInput
            style={styles.input}
            value={landlordName}
            onChangeText={setLandlordName}
            placeholder="Örn: Mehmet Özkan"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.fieldLabel}>Malik T.C. Kimlik No</Text>
          <TextInput
            style={styles.input}
            value={landlordTc}
            onChangeText={setLandlordTc}
            placeholder="11 haneli T.C. Kimlik No"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            maxLength={11}
          />

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>Kiracı (Taahhüt Eden) Ad Soyad</Text>
          <TextInput
            style={styles.input}
            value={tenantName}
            onChangeText={setTenantName}
            placeholder="Örn: Caner İneci"
            placeholderTextColor={COLORS.textMuted}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>Kiracı T.C. No</Text>
              <TextInput
                style={styles.input}
                value={tenantTc}
                onChangeText={setTenantTc}
                placeholder="Kiracı T.C."
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Kiracı Telefon</Text>
              <TextInput
                style={styles.input}
                value={tenantPhone}
                onChangeText={setTenantPhone}
                placeholder="0532 000 00 00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Kiralanan Taşınmazın Açık Adresi</Text>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            value={propertyAddress}
            onChangeText={setPropertyAddress}
            placeholder="Örn: Kadıköy, Caferağa Mah. Moda Cad. No:44 D:8 İstanbul"
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
        </View>

        {/* 2. YASAL TARİH KONTROLLERİ */}
        <Text style={styles.sectionLabel}>2. YASAL TAHLİYE TARİHLERİ (TBK m. 352)</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Kira Başlangıç Tarihi (GG.AA.YYYY)</Text>
          <TextInput
            style={styles.input}
            value={leaseStartDate}
            onChangeText={setLeaseStartDate}
            placeholder="01.09.2025"
          />

          <Text style={styles.fieldLabel}>Taahhüt Düzenlenme Tarihi (Kira başlangıcından sonra olmalıdır!)</Text>
          <TextInput
            style={[styles.input, !dateValidation.isValid && { borderColor: COLORS.danger, borderWidth: 1.5 }]}
            value={commitmentDate}
            onChangeText={setCommitmentDate}
            placeholder="15.09.2025"
          />

          <Text style={styles.fieldLabel}>Taşınmazın Tahliye Edileceği Tarih</Text>
          <TextInput
            style={[styles.input, { fontWeight: '800', color: COLORS.danger }]}
            value={evictionDate}
            onChangeText={setEvictionDate}
            placeholder="01.09.2026"
          />

          <Text style={styles.fieldLabel}>Gecikilen Gün Başına Cezai Şart (TL - Opsiyonel)</Text>
          <TextInput
            style={styles.input}
            value={penaltyPerDay}
            onChangeText={setPenaltyPerDay}
            placeholder="Örn: 2.500"
            keyboardType="numeric"
          />
        </View>

        {/* 3. EŞ / KEFİL MUVAFAKATİ (AİLE KONUTU KORUMASI) */}
        <Text style={styles.sectionLabel}>3. AİLE KONUTU & EŞ MUVAFAKATİ (TMK m. 194)</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Eş / Kefil Muvafakati Ekle</Text>
              <Text style={styles.switchSub}>Aile konutu itirazını önlemek için eşin de imzası alınır</Text>
            </View>
            <Switch
              value={hasGuarantorConsent}
              onValueChange={setHasGuarantorConsent}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          {hasGuarantorConsent && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.fieldLabel}>Eş / Kefil Ad Soyad</Text>
              <TextInput
                style={styles.input}
                value={guarantorName}
                onChangeText={setGuarantorName}
                placeholder="Eş / Kefil Ad Soyad"
              />

              <Text style={styles.fieldLabel}>Eş / Kefil T.C. Kimlik No</Text>
              <TextInput
                style={styles.input}
                value={guarantorTc}
                onChangeText={setGuarantorTc}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>
          )}
        </View>

        {/* AKSİYON BUTONU */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.actionBtn, !dateValidation.isValid && { opacity: 0.6 }]}
          onPress={handleGeneratePdf}
          disabled={isGenerating}
        >
          <Ionicons name="document-text" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>
            {isGenerating ? 'Resmi PDF Oluşturuluyor...' : 'Resmi Tahliye Taahhütnamesi PDF Oluştur'}
          </Text>
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
  legalBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  bannerGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  bannerRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  legalBannerText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  textGreen: {
    color: '#059669',
  },
  textRed: {
    color: '#DC2626',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  switchSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.primaryGlow,
    marginTop: SPACING.xs,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
