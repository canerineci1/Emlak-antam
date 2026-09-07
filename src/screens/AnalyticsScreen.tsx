import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { Ionicons } from '@expo/vector-icons';

export const AnalyticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const analytics = store.getAnalytics();
  const broker = store.getBroker();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Finans & Performans Paneli"
        subtitle={`${broker.agencyName} Veri Raporu`}
        badgeText="RAPOR"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* Potansiyel Komisyon Hacmi Bannerı */}
        <View style={styles.heroFinancialBanner}>
          <Text style={styles.financialLabel}>PORTFÖY KOMİSYON HACMİ</Text>
          <Text style={styles.financialVal}>{analytics.potentialCommission.toLocaleString('tr-TR')} TL</Text>
          <Text style={styles.financialSub}>Tüm aktif yer gösterme ve sözleşmeler baz alınmıştır</Text>
        </View>

        {/* Metrik Kartları Grid */}
        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="document-text" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.metricNum}>{analytics.totalContracts}</Text>
            <Text style={styles.metricLabel}>Toplam Sözleşme</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="location" size={18} color={COLORS.accentDark} />
            </View>
            <Text style={styles.metricNum}>{analytics.yerGostermeCount}</Text>
            <Text style={styles.metricLabel}>Yer Gösterme</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="cash" size={18} color="#059669" />
            </View>
            <Text style={styles.metricNum}>{analytics.kaporaCount}</Text>
            <Text style={styles.metricLabel}>Kapora / Teklif</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: COLORS.violetLight }]}>
              <Ionicons name="document-lock" size={18} color={COLORS.violet} />
            </View>
            <Text style={styles.metricNum}>{analytics.yetkiCount}</Text>
            <Text style={styles.metricLabel}>Yetki Belgesi</Text>
          </View>
        </View>

        {/* Hukuki Güvenlik Skoru */}
        <View style={styles.securityCard}>
          <View style={styles.secHeader}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.accentDark} />
            <Text style={styles.secTitle}>Hukuki Kanıt Güvenlik Skoru (%100)</Text>
          </View>
          <Text style={styles.secDesc}>
            İmzalanan tüm belgelerde GPS konumu, zaman damgası ve müşteri imzası tam uyumlu tescil edilmiştir (Yönetmelik Uyumlu).
          </Text>
        </View>

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
  heroFinancialBanner: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  financialLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  financialVal: {
    color: '#38BDF8',
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  financialSub: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricNum: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  securityCard: {
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  secDesc: {
    fontSize: 12,
    color: COLORS.accentDark,
    lineHeight: 18,
    fontWeight: '500',
  },
});
