import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../services/storageService';
import { calculateValuation, generateValuationPdf, ValuationInput } from '../services/valuationService';

export const ValuationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const broker = store.getBroker();

  const [propertyTitle, setPropertyTitle] = useState('Moda Cad. 3+1 Balkonlu Satılık Daire');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Kadıköy');
  const [netM2, setNetM2] = useState('115');
  const [grossM2, setGrossM2] = useState('130');
  const [rooms, setRooms] = useState('3+1');
  const [buildingAge, setBuildingAge] = useState('4');
  const [floorLevel, setFloorLevel] = useState<'ARA_KAT' | 'GIRIS' | 'EN_UST' | 'DUBLEKS'>('ARA_KAT');
  const [facade, setFacade] = useState<'GUNEY' | 'DENIZ_MANZARA' | 'DOGU_BATI' | 'KUZEY'>('GUNEY');
  const [hasParking, setHasParking] = useState(true);
  const [hasElevator, setHasElevator] = useState(true);
  const [isGatedComplex, setIsGatedComplex] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  // Anlık Hesaplama
  const valuationInput: ValuationInput = {
    propertyTitle,
    city,
    district,
    netM2: Number(netM2) || 100,
    grossM2: Number(grossM2) || 115,
    rooms,
    buildingAge: Number(buildingAge) || 0,
    floorLevel,
    facade,
    hasParking,
    hasElevator,
    isGatedComplex,
    brokerName: broker.name,
    agencyName: broker.agencyName
  };

  const result = calculateValuation(valuationInput);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      await generateValuationPdf(valuationInput, result);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Rapor oluşturulamadı.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Emsal Değerleme & CMA"
        subtitle="Bilimsel Ekspertiz & Amortisman Motoru"
        badgeText="EKSPERTİZ"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* 1. DEĞERLEME SONUÇ HERO BANNER */}
        <View style={styles.heroResultBanner}>
          <Text style={styles.heroSubText}>HEDEF OPTİMUM SATIŞ DEĞERİ</Text>
          <Text style={styles.heroMainPrice}>{result.optimumPrice.toLocaleString('tr-TR')} TL</Text>
          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>
              Taban (Hızlı): <Text style={{ fontWeight: '800' }}>{result.minQuickSalePrice.toLocaleString('tr-TR')} TL</Text>
            </Text>
            <Text style={styles.rangeText}>
              Tavan (İlan): <Text style={{ fontWeight: '800' }}>{result.maxListingPrice.toLocaleString('tr-TR')} TL</Text>
            </Text>
          </View>
        </View>

        {/* 2. 3'LÜ KPI KARTLARI */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Bölge m² Değeri</Text>
            <Text style={styles.kpiNum}>{result.adjustedM2Price.toLocaleString('tr-TR')} TL</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tahmini Kira</Text>
            <Text style={styles.kpiNum}>{result.estimatedMonthlyRent.toLocaleString('tr-TR')} TL</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Amortisman</Text>
            <Text style={styles.kpiNum}>{result.amortizationYears} Yıl (%{result.grossYieldPercent})</Text>
          </View>
        </View>

        {/* 3. TAŞINMAZ KRİTERLERİ GİRİŞİ */}
        <Text style={styles.sectionLabel}>TAŞINMAZ KRİTERLERİ & PARAMETRELER</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Portföy Başlığı</Text>
          <TextInput
            style={styles.input}
            value={propertyTitle}
            onChangeText={setPropertyTitle}
          />

          <View style={styles.twoCol}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>İlçe (Kadıköy, Beşiktaş vb.)</Text>
              <TextInput
                style={styles.input}
                value={district}
                onChangeText={setDistrict}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Oda Sayısı</Text>
              <TextInput
                style={styles.input}
                value={rooms}
                onChangeText={setRooms}
              />
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>Net Alan (m²)</Text>
              <TextInput
                style={styles.input}
                value={netM2}
                onChangeText={setNetM2}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Bina Yaşı</Text>
              <TextInput
                style={styles.input}
                value={buildingAge}
                onChangeText={setBuildingAge}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Kat Konumu Seçici */}
          <Text style={styles.fieldLabel}>Kat Konumu</Text>
          <View style={styles.chipGroup}>
            {(['ARA_KAT', 'GIRIS', 'EN_UST', 'DUBLEKS'] as const).map(lvl => (
              <TouchableOpacity
                key={lvl}
                style={[styles.choiceChip, floorLevel === lvl && styles.choiceChipActive]}
                onPress={() => setFloorLevel(lvl)}
              >
                <Text style={[styles.choiceChipText, floorLevel === lvl && styles.choiceChipTextActive]}>
                  {lvl.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cephe & Manzara */}
          <Text style={styles.fieldLabel}>Cephe ve Manzara</Text>
          <View style={styles.chipGroup}>
            {(['GUNEY', 'DENIZ_MANZARA', 'DOGU_BATI', 'KUZEY'] as const).map(fac => (
              <TouchableOpacity
                key={fac}
                style={[styles.choiceChip, facade === fac && styles.choiceChipActive]}
                onPress={() => setFacade(fac)}
              >
                <Text style={[styles.choiceChipText, facade === fac && styles.choiceChipTextActive]}>
                  {fac.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Donatılar Switch */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Otopark Mevcut (+%4 Değer)</Text>
            <Switch value={hasParking} onValueChange={setHasParking} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Asansör Mevcut (+%3 Değer)</Text>
            <Switch value={hasElevator} onValueChange={setHasElevator} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Güvenlikli Site İçi (+%6 Değer)</Text>
            <Switch value={isGatedComplex} onValueChange={setIsGatedComplex} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
          </View>
        </View>

        {/* AKSİYON BUTONLARI */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.actionBtn}
          onPress={handleGeneratePdf}
          disabled={isGenerating}
        >
          <Ionicons name="document-text" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>
            {isGenerating ? 'Ekspertiz Raporu Hazırlanıyor...' : 'Resmi Ekspertiz Raporu PDF Oluştur'}
          </Text>
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
  },
  heroResultBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.primaryGlow,
  },
  heroSubText: {
    fontSize: 11,
    color: '#BFDBFE',
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroMainPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  rangeText: {
    fontSize: 11,
    color: '#E0E7FF',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  kpiLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  kpiNum: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 3,
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
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.text,
  },
  twoCol: {
    flexDirection: 'row',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  choiceChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  choiceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  choiceChipTextActive: {
    color: COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
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
