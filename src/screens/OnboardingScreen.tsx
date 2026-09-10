import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Platform,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { getCurrentUser, completeOnboarding, UserProfile } from '../services/authService';

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const CITY_OPTIONS = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Muğla', 'Eskişehir', 'Diğer'];

const SPECIALTY_OPTIONS = [
  { id: 'konut', label: 'Konut & Daire', icon: 'home-outline' as const },
  { id: 'villa', label: 'Lüks Konut & Villa', icon: 'diamond-outline' as const },
  { id: 'ticari', label: 'Ticari & Ofis & Plaza', icon: 'business-outline' as const },
  { id: 'arsa', label: 'Arsa & Arazi & Tarla', icon: 'map-outline' as const },
  { id: 'proje', label: 'Proje & Sıfır Konut', icon: 'cube-outline' as const },
  { id: 'sanayi', label: 'Sanayi & Depo', icon: 'construct-outline' as const },
  { id: 'kentsel', label: 'Kentsel Dönüşüm', icon: 'refresh-circle-outline' as const },
  { id: 'turistik', label: 'Yazlık & Turistik Tesis', icon: 'sunny-outline' as const }
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onSkip }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const currentUser = getCurrentUser();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Kimlik & Ofis
  const [name, setName] = useState(currentUser.name || '');
  const [agencyName, setAgencyName] = useState(
    currentUser.agencyName === 'EmlakÇantam Gayrimenkul' ? '' : (currentUser.agencyName || '')
  );
  const [selectedCity, setSelectedCity] = useState(currentUser.city || 'İstanbul');
  const [licenseNumber, setLicenseNumber] = useState(currentUser.licenseNumber || '');

  // Step 2: Uzmanlık
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    currentUser.specialization && currentUser.specialization.length > 0
      ? currentUser.specialization
      : ['Konut & Daire']
  );

  // Step 3: Özellik Onayı
  const [enableWhisperAi, setEnableWhisperAi] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableAutoPdf, setEnableAutoPdf] = useState(true);

  const toggleSpecialty = (label: string) => {
    if (selectedSpecialties.includes(label)) {
      if (selectedSpecialties.length > 1) {
        setSelectedSpecialties(selectedSpecialties.filter(s => s !== label));
      }
    } else {
      setSelectedSpecialties([...selectedSpecialties, label]);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        Alert.alert('İsim Gerekli', 'Lütfen ad ve soyadınızı belirtiniz.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedSpecialties.length === 0) {
        Alert.alert('Uzmanlık Seçimi', 'Lütfen en az bir uzmanlık alanı seçiniz.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4); // Başarı / Özet Ekranı
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as any);
    }
  };

  const handleFinalize = async () => {
    try {
      await completeOnboarding({
        name: name.trim() || currentUser.name,
        agencyName: agencyName.trim() || 'Emlak & Gayrimenkul Ofisi',
        city: selectedCity,
        licenseNumber: licenseNumber.trim(),
        specialization: selectedSpecialties
      });
      onComplete();
    } catch (e) {
      console.warn('Onboarding finalize error', e);
      onComplete();
    }
  };

  const handleSkipAll = async () => {
    try {
      await completeOnboarding({
        name: currentUser.name || 'Gayrimenkul Danışmanı',
        agencyName: currentUser.agencyName || 'Emlak Ofisi',
        city: 'İstanbul',
        specialization: ['Konut & Daire']
      });
    } catch (e) {
      console.warn('Skip error', e);
    }
    if (onSkip) onSkip();
    else onComplete();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 1. ÜST HEADER & PROGRESS BARI */}
      <View style={styles.topHeader}>
        <View style={[styles.headerInner, { maxWidth: isTablet ? 600 : '100%' }]}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.headerBrandTitle}>EmlakÇantam Kurulum</Text>
            </View>

            {currentStep < 4 && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.skipBtn}
                onPress={handleSkipAll}
              >
                <Text style={styles.skipBtnText}>Şimdilik Atla</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* İLERLEME ÇUBUĞU */}
          {currentStep < 4 && (
            <View style={styles.progressBarWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%' }
                  ]}
                />
              </View>
              <Text style={styles.progressStepLabel}>Adım {currentStep} / 3</Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. ADIM İÇERİĞİ */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { maxWidth: isTablet ? 600 : '100%', alignSelf: 'center', width: '100%' }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* ========== ADIM 1: PROFİL & OFİS ========== */}
          {currentStep === 1 && (
            <View>
              <View style={styles.stepTitleBox}>
                <View style={[styles.stepIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="person-circle" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.stepTitle}>Profil & Ofis Kimliği</Text>
                <Text style={styles.stepSubtitle}>
                  Sözleşmelerde, tahliye taahhütnamelerinde ve dijital kartvizitinizde yer alacak resmi bilgileri tanımlayın.
                </Text>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>AD & SOYAD *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Örn: Ahmet Yılmaz"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>OFİS / ŞİRKET ADI</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="business-outline" size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Örn: Remax Gold, Turyap veya Bağımsız Emlak"
                    placeholderTextColor={COLORS.textMuted}
                    value={agencyName}
                    onChangeText={setAgencyName}
                  />
                </View>

                <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>HİZMET BÖLGESİ / ŞEHİR</Text>
                <View style={styles.cityPillsWrap}>
                  {CITY_OPTIONS.map((city) => {
                    const isSelected = selectedCity === city;
                    return (
                      <TouchableOpacity
                        key={city}
                        activeOpacity={0.8}
                        style={[styles.cityPill, isSelected && styles.cityPillActive]}
                        onPress={() => setSelectedCity(city)}
                      >
                        <Text style={[styles.cityPillText, isSelected && styles.cityPillTextActive]}>
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>
                  YETKİ BELGESİ NO (OPSİYONEL)
                </Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="ribbon-outline" size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Taşınmaz Ticareti Yetki Belge No (Örn: 3400123)"
                    placeholderTextColor={COLORS.textMuted}
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}

          {/* ========== ADIM 2: UZMANLIK ALANLARI ========== */}
          {currentStep === 2 && (
            <View>
              <View style={styles.stepTitleBox}>
                <View style={[styles.stepIconCircle, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="briefcase" size={26} color={COLORS.violet} />
                </View>
                <Text style={styles.stepTitle}>Uzmanlık & Portföy Odağı</Text>
                <Text style={styles.stepSubtitle}>
                  Çalıştığınız mülk tiplerini seçin. Akıllı CRM motoru müşteri talepleri ile portföyünüzü buna göre eşleştirir.
                </Text>
              </View>

              <View style={styles.specialtiesGrid}>
                {SPECIALTY_OPTIONS.map((item) => {
                  const isChecked = selectedSpecialties.includes(item.label);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.85}
                      style={[
                        styles.specialtyCard,
                        isChecked && styles.specialtyCardActive
                      ]}
                      onPress={() => toggleSpecialty(item.label)}
                    >
                      <View style={[styles.specialtyIconWrap, isChecked && styles.specialtyIconWrapActive]}>
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={isChecked ? COLORS.primary : COLORS.textSecondary}
                        />
                      </View>
                      <Text style={[styles.specialtyLabel, isChecked && styles.specialtyLabelActive]}>
                        {item.label}
                      </Text>
                      <View style={[styles.specialtyCheck, isChecked && styles.specialtyCheckActive]}>
                        {isChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ========== ADIM 3: SAHA SÜPER GÜÇLERİ ========== */}
          {currentStep === 3 && (
            <View>
              <View style={styles.stepTitleBox}>
                <View style={[styles.stepIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="flash" size={26} color="#059669" />
                </View>
                <Text style={styles.stepTitle}>Saha Süper Güçleriniz</Text>
                <Text style={styles.stepSubtitle}>
                  Saha operasyonlarınızı kolaylaştıran gelişmiş araçları aktif edin.
                </Text>
              </View>

              <View style={styles.featureSwitchCard}>
                {/* 1. Groq Whisper AI */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.switchRow}
                  onPress={() => setEnableWhisperAi(!enableWhisperAi)}
                >
                  <View style={[styles.switchIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="mic" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.switchTitle}>Groq Whisper AI Sesli Notlar</Text>
                    <Text style={styles.switchDesc}>
                      Müşteri görüşmesi ses kaydını anında CRM özetine ve portföy ilanına dönüştürür.
                    </Text>
                  </View>
                  <Ionicons
                    name={enableWhisperAi ? 'toggle' : 'toggle-outline'}
                    size={34}
                    color={enableWhisperAi ? '#059669' : COLORS.textMuted}
                  />
                </TouchableOpacity>

                <View style={styles.dividerLine} />

                {/* 2. Bildirimler */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.switchRow}
                  onPress={() => setEnableNotifications(!enableNotifications)}
                >
                  <View style={[styles.switchIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="notifications" size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.switchTitle}>Sözleşme & Süre Hatırlatıcıları</Text>
                    <Text style={styles.switchDesc}>
                      Kira artışı ve tahliye taahhütnamesi süreleri dolmadan önce otomatik uyarı alın.
                    </Text>
                  </View>
                  <Ionicons
                    name={enableNotifications ? 'toggle' : 'toggle-outline'}
                    size={34}
                    color={enableNotifications ? COLORS.primary : COLORS.textMuted}
                  />
                </TouchableOpacity>

                <View style={styles.dividerLine} />

                {/* 3. Otomatik PDF & QR Doğrulama */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.switchRow}
                  onPress={() => setEnableAutoPdf(!enableAutoPdf)}
                >
                  <View style={[styles.switchIconBox, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="qr-code" size={20} color={COLORS.violet} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.switchTitle}>QR Doğrulamalı E-İmza PDF</Text>
                    <Text style={styles.switchDesc}>
                      Sözleşmelerinizi müşterinize imzalatıp resmi QR kodlu PDF olarak WhatsApp'tan paylaşın.
                    </Text>
                  </View>
                  <Ionicons
                    name={enableAutoPdf ? 'toggle' : 'toggle-outline'}
                    size={34}
                    color={enableAutoPdf ? COLORS.violet : COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ========== ADIM 4: TAMAMLANDI / ÖZET KARTI ========== */}
          {currentStep === 4 && (
            <View style={styles.completionWrap}>
              <View style={styles.celebrationIcon}>
                <Ionicons name="checkmark-done-circle" size={68} color={COLORS.accent} />
              </View>

              <Text style={styles.completionTitle}>Tebrikler, Kurulum Tamamlandı!</Text>
              <Text style={styles.completionSubtitle}>
                EmlakÇantam artık firmanız ve saha operasyonlarınız için tamamen özelleştirildi.
              </Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Danışman / Broker:</Text>
                  <Text style={styles.summaryValue}>{name || currentUser.name}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ofis / Şirket:</Text>
                  <Text style={styles.summaryValue}>{agencyName || 'EmlakÇantam Ofisi'}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Hizmet Şehri:</Text>
                  <Text style={styles.summaryValue}>{selectedCity}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Odak Alanlar:</Text>
                  <Text style={[styles.summaryValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {selectedSpecialties.join(', ')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 3. ALT AKSİYON ÇUBUĞU */}
      <View style={styles.bottomBar}>
        <View style={[styles.bottomBarInner, { maxWidth: isTablet ? 600 : '100%' }]}>
          {currentStep < 4 ? (
            <View style={styles.actionBtnRow}>
              {currentStep > 1 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.prevBtn}
                  onPress={handleBack}
                >
                  <Ionicons name="arrow-back" size={18} color={COLORS.text} />
                  <Text style={styles.prevBtnText}>Geri</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.nextBtn, currentStep === 1 && { flex: 1 }]}
                onPress={handleNext}
              >
                <Text style={styles.nextBtnText}>
                  {currentStep === 3 ? 'Özeti İncele' : 'Devam Et'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.finishBtn}
              onPress={handleFinalize}
            >
              <Text style={styles.finishBtnText}>Ofis Paneline Başla</Text>
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerInner: {
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  progressBarWrap: {
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressStepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 20,
  },
  stepTitleBox: {
    marginBottom: SPACING.lg,
  },
  stepIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  cityPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cityPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  cityPillTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  specialtiesGrid: {
    gap: 10,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  specialtyCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAFCFF',
  },
  specialtyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  specialtyIconWrapActive: {
    backgroundColor: '#EFF6FF',
  },
  specialtyLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  specialtyLabelActive: {
    color: COLORS.primary,
  },
  specialtyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialtyCheckActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  featureSwitchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  switchDesc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  completionWrap: {
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  celebrationIcon: {
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  completionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.xl,
    paddingHorizontal: 10,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  bottomBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.md,
  },
  bottomBarInner: {
    alignSelf: 'center',
    width: '100%',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  prevBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    gap: 8,
    ...SHADOWS.sm,
  },
  nextBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    gap: 10,
    ...SHADOWS.sm,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
