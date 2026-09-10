import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface LandingScreenProps {
  onStart: () => void;
  onLogin: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart, onLogin }) => {
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const isTablet = width >= 768;

  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  const features = [
    {
      id: 'contracts',
      icon: 'document-text' as const,
      color: COLORS.primary,
      bgColor: '#EFF6FF',
      badge: 'MEVZUAT UYUMLU',
      title: 'Hukuki E-Sözleşmeler & E-İmza',
      description: 'Yer gösterme, kira kontratı, tahliye taahhütnamesi ve aracılık sözleşmelerini sahada dakikalar içinde hazırlayın. Dokunmatik ekran e-imza ile resmi PDF üretin.'
    },
    {
      id: 'whisper_ai',
      icon: 'mic' as const,
      color: '#059669',
      bgColor: '#ECFDF5',
      badge: 'GROQ WHISPER AI',
      title: 'Yapay Zeka Sesli Saha Asistanı',
      description: 'Görüşmeden çıkınca sesli notunuzu kaydedin. Groq Whisper Large v3 yapay zekası konuşmanızı anında dinler, CRM müşterisi ve ilan metni taslağı oluşturur.'
    },
    {
      id: 'calculator',
      icon: 'calculator' as const,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      badge: '2026 YASAL MEVZUAT',
      title: 'Yasal %4 Tapu Harcı & Değerleme',
      description: 'Resmi yasal %4 tapu harcı, döner sermaye bedeli, emlak komisyonu ve konut kredisi taksitlerini müşterinizin yanındayken saniyeler içinde hesaplayın.'
    },
    {
      id: 'smart_match',
      icon: 'git-merge' as const,
      color: '#EA580C',
      bgColor: '#FFF7ED',
      badge: 'AKILLI CRM MOTORU',
      title: 'Portföy & Müşteri Eşleştirme',
      description: 'Alıcı ve kiracı talepleri ile portföyünüzdeki gayrimenkulleri otomatik eşleştirin. Hiçbir satışı veya kiralamayı kaçırmayın.'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* 1. ÜST HERO MARKALAMA & STATÜ BARI */}
      <View style={styles.heroHeader}>
        <View style={[styles.headerInner, { maxWidth: isTablet ? 600 : '100%' }]}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="business" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandTitle}>
                EmlakÇantam<Text style={styles.brandDot}>.</Text>
              </Text>
              <Text style={styles.brandSubtitle}>Yeni Nesil Gayrimenkul Takım Çantası</Text>
            </View>
            <View style={styles.versionPill}>
              <Text style={styles.versionPillText}>v2.0 PRO</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. KAYDIRILABİLİR İÇERİK */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: isTablet ? 640 : '100%', alignSelf: 'center', width: '100%' }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ANA DEĞER BAŞLIĞI */}
        <View style={styles.valueHeadSection}>
          <View style={styles.liveNoticeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveNoticeText}>TAŞINMAZ TİCARETİ YÖNETMELİĞİ UYUMLU</Text>
          </View>

          <Text style={[styles.mainHeroHeadline, { fontSize: isSmallDevice ? 24 : 28 }]}>
            Tüm Emlak Ofisiniz & Saha Asistanınız Tek Uygulamada.
          </Text>

          <Text style={styles.mainHeroSubtext}>
            Sözleşmelerden yapay zeka sesli notlara, yasal %4 tapu harcından portföy yönetimine kadar gayrimenkul profesyonellerinin ihtiyaç duyduğu her şey.
          </Text>
        </View>

        {/* GÜVEN VE İSTATİSTİK ŞERİDİ */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>15.000+</Text>
            <Text style={styles.metricLbl}>Danışman Tercihi</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>%100</Text>
            <Text style={styles.metricLbl}>Yasal & E-İmza</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>45 Dk</Text>
            <Text style={styles.metricLbl}>Günlük Zaman Tasarrufu</Text>
          </View>
        </View>

        {/* ÖZELLİK VİTRİNİ BAŞLIĞI */}
        <View style={styles.featureHeaderRow}>
          <Text style={styles.sectionTitle}>Gelişmiş Kurumsal Yetenekler</Text>
          <Text style={styles.sectionSub}>Ofisinizi ve saha operasyonlarınızı hızlandıran araçlar</Text>
        </View>

        {/* 4 TEMEL ÖZELLİK KARTI */}
        <View style={styles.featureCardsWrap}>
          {features.map((item, index) => {
            const isSelected = activeFeatureIndex === index;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.88}
                style={[
                  styles.featureCard,
                  isSelected && styles.featureCardSelected
                ]}
                onPress={() => setActiveFeatureIndex(index)}
              >
                <View style={styles.featureCardTop}>
                  <View style={[styles.featureIconWrap, { backgroundColor: item.bgColor }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={[styles.featureBadge, { backgroundColor: item.bgColor }]}>
                    <Text style={[styles.featureBadgeText, { color: item.color }]}>{item.badge}</Text>
                  </View>
                </View>

                <Text style={styles.featureCardTitle}>{item.title}</Text>
                <Text style={styles.featureCardDesc}>{item.description}</Text>

                {isSelected && (
                  <View style={styles.activeFeatureFoot}>
                    <Ionicons name="checkmark-circle" size={15} color={item.color} />
                    <Text style={[styles.activeFeatureFootText, { color: item.color }]}>
                      Aktif ve kullanıma hazır
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* GÜVENLİK VE BULUT BİLGİ KARTI */}
        <View style={styles.cloudSecurityCard}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cloudSecTitle}>Google Cloud & Firebase Altyapısı</Text>
            <Text style={styles.cloudSecDesc}>
              Verileriniz cihazınızda şifrelenir, internet olduğunda bulut ile çift yönlü yedeklenir. Sahada internetsizken bile kesintisiz çalışabilirsiniz.
            </Text>
          </View>
        </View>

        {/* ALT ALAN İÇİN BOŞLUK */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* 3. SABİT ALT AKSİYON ÇUBUĞU (CALL TO ACTIONS) */}
      <View style={styles.bottomBar}>
        <View style={[styles.bottomBarInner, { maxWidth: isTablet ? 600 : '100%' }]}>
          {/* BİRİNCİL BUTON: HEMEN BAŞLA */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.primaryActionBtn}
            onPress={onStart}
          >
            <Text style={styles.primaryActionBtnText}>Hemen Başla</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* İKİNCİL BUTON: GİRİŞ YAP */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.secondaryActionBtn}
            onPress={onLogin}
          >
            <Text style={styles.secondaryActionBtnText}>Zaten Hesabım Var, Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  heroHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerInner: {
    alignSelf: 'center',
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...SHADOWS.sm,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandDot: {
    color: COLORS.primary,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  versionPill: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 20,
  },
  valueHeadSection: {
    marginBottom: SPACING.lg,
  },
  liveNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  liveNoticeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  mainHeroHeadline: {
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  mainHeroSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  metricLbl: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  featureHeaderRow: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  featureCardsWrap: {
    gap: 12,
    marginBottom: SPACING.lg,
  },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  featureCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAFCFF',
  },
  featureCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  featureBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureCardDesc: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  activeFeatureFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 6,
  },
  activeFeatureFootText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cloudSecurityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cloudSecTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2,
  },
  cloudSecDesc: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
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
    gap: 8,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
});
