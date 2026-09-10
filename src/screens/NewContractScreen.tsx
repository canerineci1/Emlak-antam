import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { Property, ContractType, ContractExtraDetails } from '../types';
import { Ionicons } from '@expo/vector-icons';

export const NewContractScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const properties = store.getProperties();

  // 1. Sözleşme Türü
  const [contractType, setContractType] = useState<ContractType>('YER_GOSTERME');

  // 2. Taşınmaz Seçimi
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || 'custom');
  const [customAddress, setCustomAddress] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // 3. Müşteri Bilgileri
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientIdNumber, setClientIdNumber] = useState('');

  // 4. Ekstra Alanlar
  const [offerPrice, setOfferPrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [validUntilDays, setValidUntilDays] = useState('3');
  const [commissionRate, setCommissionRate] = useState('2');
  const [durationMonths, setDurationMonths] = useState('3');
  const [clientFeedback, setClientFeedback] = useState('');

  const handleProceedToSignature = () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tarafın adını, soyadını ve telefon numarasını giriniz.');
      return;
    }

    let targetProperty: Property;

    if (selectedPropId === 'custom') {
      if (!customTitle.trim() || !customAddress.trim()) {
        Alert.alert('Eksik Bilgi', 'Lütfen taşınmaz başlığı ve açık adresini giriniz.');
        return;
      }
      targetProperty = {
        id: `prop_${Date.now()}`,
        title: customTitle,
        city: 'İstanbul',
        district: 'Merkez',
        neighborhood: '',
        fullAddress: customAddress,
        price: customPrice || 'Belirtilmedi',
        type: 'SATILIK',
        propertyCategory: 'DAIRE'
      };
    } else {
      const found = properties.find(p => p.id === selectedPropId);
      if (!found) {
        Alert.alert('Hata', 'Lütfen bir portföy seçiniz.');
        return;
      }
      targetProperty = found;
    }

    const extras: ContractExtraDetails = {
      offerPrice: offerPrice || targetProperty.price,
      depositAmount: depositAmount || '0',
      validUntilDays,
      commissionRate,
      durationMonths,
      clientFeedback: clientFeedback || 'Görüşme olumlu geçti.'
    };

    navigation.navigate('Signature', {
      property: targetProperty,
      client: {
        name: clientName,
        phone: clientPhone,
        idNumber: clientIdNumber
      },
      contractType,
      extras
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Yeni Sözleşme"
        subtitle="Hukuki Şablon & İmza Hazırlığı"
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
        {/* SEGMENTED CONTROL: SÖZLEŞME TÜRÜ */}
        <Text style={styles.sectionLabel}>BELGE TÜRÜ SEÇİMİ</Text>
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.segBtn, contractType === 'YER_GOSTERME' && styles.segBtnActive]}
            onPress={() => setContractType('YER_GOSTERME')}
          >
            <Ionicons name="location" size={16} color={contractType === 'YER_GOSTERME' ? '#FFFFFF' : COLORS.textSecondary} />
            <Text style={[styles.segBtnText, contractType === 'YER_GOSTERME' && styles.segBtnTextActive]}>
              Yer Gösterme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.segBtn, contractType === 'KAPORA_TEKLIFFORMU' && styles.segBtnActiveKapora]}
            onPress={() => setContractType('KAPORA_TEKLIFFORMU')}
          >
            <Ionicons name="cash" size={16} color={contractType === 'KAPORA_TEKLIFFORMU' ? '#FFFFFF' : COLORS.textSecondary} />
            <Text style={[styles.segBtnText, contractType === 'KAPORA_TEKLIFFORMU' && styles.segBtnTextActive]}>
              Teklif/Kapora
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.segBtn, contractType === 'YETKI_BELGESI' && styles.segBtnActiveYetki]}
            onPress={() => setContractType('YETKI_BELGESI')}
          >
            <Ionicons name="document-lock" size={16} color={contractType === 'YETKI_BELGESI' ? '#FFFFFF' : COLORS.textSecondary} />
            <Text style={[styles.segBtnText, contractType === 'YETKI_BELGESI' && styles.segBtnTextActive]}>
              Yetki
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. TAŞINMAZ SEÇİMİ */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>GÖSTERİLECEK TAŞINMAZ</Text>
        {properties.map((prop) => (
          <TouchableOpacity
            key={prop.id}
            activeOpacity={0.85}
            style={[
              styles.propOptionCard,
              selectedPropId === prop.id && styles.propOptionCardActive
            ]}
            onPress={() => setSelectedPropId(prop.id)}
          >
            <View style={[styles.radioCircle, selectedPropId === prop.id && styles.radioCircleActive]}>
              {selectedPropId === prop.id && <View style={styles.radioInner} />}
            </View>

            <View style={styles.propTextCol}>
              <Text style={styles.propTitle} numberOfLines={1}>{prop.title}</Text>
              <Text style={styles.propMeta}>{prop.district}, {prop.city} • {prop.price} TL</Text>
            </View>

            <View style={styles.typeBadgePill}>
              <Text style={styles.typeBadgePillText}>{prop.type}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Manuel Taşınmaz Seçeneği */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.propOptionCard,
            selectedPropId === 'custom' && styles.propOptionCardActive
          ]}
          onPress={() => setSelectedPropId('custom')}
        >
          <View style={[styles.radioCircle, selectedPropId === 'custom' && styles.radioCircleActive]}>
            {selectedPropId === 'custom' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.propTextCol}>
            <Text style={styles.propTitle}>+ Manuel / Yeni Taşınmaz Gir</Text>
            <Text style={styles.propMeta}>Portföy harici özel mülk girişi</Text>
          </View>
        </TouchableOpacity>

        {selectedPropId === 'custom' && (
          <View style={[styles.inputCard, { marginTop: 6 }]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Taşınmaz Başlığı *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Kadıköy Moda 3+1 Balkonlu Daire"
                placeholderTextColor={COLORS.textMuted}
                value={customTitle}
                onChangeText={setCustomTitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Açık Adres / Ada Parsel *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Caferağa Mah. Moda Cad. No:12 D:4 Kadıköy"
                placeholderTextColor={COLORS.textMuted}
                value={customAddress}
                onChangeText={setCustomAddress}
              />
            </View>

            <View style={styles.fieldGroupLast}>
              <Text style={styles.inputLabel}>Satış / Kiralama Fiyatı (TL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 9.500.000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={customPrice}
                onChangeText={setCustomPrice}
              />
            </View>
          </View>
        )}

        {/* 3. TARAF / MÜŞTERİ BİLGİLERİ */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>
          {contractType === 'YETKI_BELGESI' ? 'MÜLK SAHİBİ (MALİK) BİLGİLERİ' : 'ALICI / KİRACI BİLGİLERİ'}
        </Text>

        <View style={styles.inputCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Adı Soyadı *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Mehmet Özkan"
              placeholderTextColor={COLORS.textMuted}
              value={clientName}
              onChangeText={setClientName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Telefon Numarası *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0532 123 45 67"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={clientPhone}
              onChangeText={setClientPhone}
            />
          </View>

          <View style={styles.fieldGroupLast}>
            <Text style={styles.inputLabel}>T.C. Kimlik / Pasaport No (Opsiyonel)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="11 haneli T.C. No"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={11}
              value={clientIdNumber}
              onChangeText={setClientIdNumber}
            />
          </View>
        </View>

        {/* 4. TÜRE ÖZEL FORM ALANLARI */}
        {contractType === 'KAPORA_TEKLIFFORMU' && (
          <View style={styles.extraBoxKapora}>
            <Text style={styles.extraBoxTitle}>💰 Teklif & Kapora Şartları</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Alıcının Teklif Ettiği Fiyat (TL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 14.000.000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={offerPrice}
                onChangeText={setOfferPrice}
              />
            </View>
            <View style={styles.fieldGroupLast}>
              <Text style={styles.inputLabel}>Alınan Kapora Tutarı (TL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 100.000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
            </View>
          </View>
        )}

        {contractType === 'YER_GOSTERME' && (
          <View style={[styles.inputCard, { marginTop: SPACING.md }]}>
            <View style={styles.fieldGroupLast}>
              <Text style={styles.inputLabel}>Müşteri Ziyaret Notu (Ev Sahibine WhatsApp Raporu İçin)</Text>
              <TextInput
                style={[styles.textInput, { height: 64, textAlignVertical: 'top' }]}
                placeholder="Örn: Evi beğendi, kredi teklifi bekliyor."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={clientFeedback}
                onChangeText={setClientFeedback}
              />
            </View>
          </View>
        )}

        {/* İMZAYA GEÇ BUTONU */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.continueButton}
          onPress={handleProceedToSignature}
        >
          <Text style={styles.continueButtonText}>İmzaya Geç (GPS & Zaman Damgası)</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  segBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  segBtnActiveKapora: {
    backgroundColor: COLORS.accent,
    ...SHADOWS.sm,
  },
  segBtnActiveYetki: {
    backgroundColor: COLORS.violet,
    ...SHADOWS.sm,
  },
  segBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  segBtnTextActive: {
    color: '#FFFFFF',
  },
  propOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  propOptionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  propTextCol: {
    flex: 1,
  },
  propTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  propMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  typeBadgePill: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  typeBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  fieldGroup: {
    marginBottom: SPACING.sm,
  },
  fieldGroupLast: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
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
    fontWeight: '500',
  },
  extraBoxKapora: {
    backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: SPACING.md,
  },
  extraBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentDark,
    marginBottom: SPACING.sm,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.lg,
    ...SHADOWS.primaryGlow,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
