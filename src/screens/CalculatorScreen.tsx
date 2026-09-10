import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { calculateRealEstateExpenses, buildExpensePlanWhatsAppText } from '../services/calculatorService';
import { Ionicons } from '@expo/vector-icons';

export const CalculatorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const properties = store.getProperties();

  const [priceStr, setPriceStr] = useState('10000000');
  const [loanStr, setLoanStr] = useState('4000000');
  const [rateStr, setRateStr] = useState('2.89');
  const [termStr, setTermStr] = useState('120');
  const [selectedPropId, setSelectedPropId] = useState<string>('');

  const propertyPrice = parseFloat(priceStr.replace(/\./g, '').replace(/,/g, '')) || 0;
  const loanAmount = parseFloat(loanStr.replace(/\./g, '').replace(/,/g, '')) || 0;
  const monthlyInterestRate = parseFloat(rateStr.replace(',', '.')) || 0;
  const termMonths = parseInt(termStr, 10) || 120;

  const result = calculateRealEstateExpenses({
    propertyPrice,
    loanAmount,
    monthlyInterestRate,
    termMonths,
  });

  const handleSelectProperty = (propId: string) => {
    setSelectedPropId(propId);
    const found = properties.find(p => p.id === propId);
    if (found) {
      const num = found.price.replace(/\./g, '').replace(/,/g, '');
      setPriceStr(num);
      const calculatedLoan = Math.round(parseFloat(num) * 0.5); // Varsayılan %50 kredi
      setLoanStr(calculatedLoan.toString());
    }
  };

  const handleShareWhatsApp = () => {
    const selectedProp = properties.find(p => p.id === selectedPropId);
    const msg = buildExpensePlanWhatsAppText(result, selectedProp?.title);
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Bilgi', 'WhatsApp açılamadı.');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Tapu Harcı & Kredi Motoru"
        subtitle="Alım Masrafları ve Aylık Taksit Hesabı"
        badgeText="HESAPLAYICI"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* Portföyden Hızlı Doldurma */}
        <Text style={styles.sectionLabel}>PORTFÖYDEN HIZLI FİYAT ÇEK</Text>
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

        {/* Giriş Alanları Grid */}
        <View style={styles.inputCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Taşınmaz Satış Fiyatı (TL)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={priceStr}
              onChangeText={setPriceStr}
              placeholder="10000000"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.fieldGroup, { flex: 1.5 }]}>
              <Text style={styles.inputLabel}>Kredi Tutarı (TL)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={loanStr}
                onChangeText={setLoanStr}
                placeholder="4000000"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Aylık Faiz %</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                value={rateStr}
                onChangeText={setRateStr}
                placeholder="2.89"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 0.9 }]}>
              <Text style={styles.inputLabel}>Vade (Ay)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={termStr}
                onChangeText={setTermStr}
                placeholder="120"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        {/* SONUÇ 1: KREDİ AYLIK TAKSİT HERO */}
        {result.loanAmount > 0 && (
          <View style={styles.loanHeroBanner}>
            <Text style={styles.loanHeroLabel}>TAHMİNİ AYLIK KREDİ TAKSİTİ</Text>
            <Text style={styles.loanHeroVal}>{result.monthlyPayment.toLocaleString('tr-TR')} TL</Text>
            <Text style={styles.loanHeroSub}>
              {termMonths} Ay Vade • Toplam Geri Ödeme: {result.totalRepayment.toLocaleString('tr-TR')} TL
            </Text>
          </View>
        )}

        {/* SONUÇ 2: TAPU VE MASRAF DÖKÜMÜ KARTI */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>TAPU VE ALIM MASRAFLARI DÖKÜMÜ</Text>

          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Alıcı Tapu Harcı (%2):</Text>
            <Text style={styles.expenseVal}>{result.buyerDeedFee.toLocaleString('tr-TR')} TL</Text>
          </View>

          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Tapu Harcı & Masraflar (%4):</Text>
            <Text style={styles.expenseVal}>{result.revolvingFund.toLocaleString('tr-TR')} TL</Text>
          </View>

          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Hizmet Komisyonu (%2 + %20 KDV):</Text>
            <Text style={styles.expenseVal}>{result.brokerCommission.toLocaleString('tr-TR')} TL</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.expenseRowTotal}>
            <Text style={styles.totalLabel}>Toplam Alıcı Masrafları:</Text>
            <Text style={styles.totalVal}>{result.totalBuyerExpenses.toLocaleString('tr-TR')} TL</Text>
          </View>
        </View>

        {/* SONUÇ 3: GEREKLİ TOPLAM NAKİT İHTİYACI */}
        <View style={styles.cashNeededCard}>
          <View style={styles.cashHeader}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.accentDark} />
            <Text style={styles.cashTitle}>Toplam Gerekli Nakit İhtiyacı</Text>
          </View>
          <Text style={styles.cashAmount}>{result.totalCashNeeded.toLocaleString('tr-TR')} TL</Text>
          <Text style={styles.cashSub}>
            Peşinat ({result.downPayment.toLocaleString('tr-TR')} TL) + Alım Masrafları ({result.totalBuyerExpenses.toLocaleString('tr-TR')} TL)
          </Text>
        </View>

        {/* WHATSAPP İLE GÖNDER BUTONU */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.whatsappShareBtn}
          onPress={handleShareWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          <Text style={styles.whatsappShareBtnText}>Müşteriye WhatsApp'tan Masraf Planı Gönder</Text>
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
  fieldGroup: {
    marginBottom: SPACING.xs,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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
  loanHeroBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.primaryGlow,
  },
  loanHeroLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  loanHeroVal: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  loanHeroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
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
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  expenseLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  expenseVal: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xs,
  },
  expenseRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  totalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cashNeededCard: {
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cashTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  cashAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.accentDark,
    marginVertical: 2,
  },
  cashSub: {
    fontSize: 11,
    color: COLORS.accentDark,
    fontWeight: '500',
  },
  whatsappShareBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  whatsappShareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});