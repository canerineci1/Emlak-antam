import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

export const QrSignScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const contractId = route.params?.contractId || `cnt_${Date.now()}`;
  const liveSignUrl = `https://emlakcantam.app/sign/${contractId}`;

  const handleShareLink = () => {
    const msg = `Sayın Müşterimiz,\n\nTaşınmaz Gösterme Belgenizi kendi telefonunuzdan temassız olarak güvenle imzalamak için aşağıdaki bağlantıya tıklayabilirsiniz:\n\n🔗 ${liveSignUrl}`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Bilgi', 'WhatsApp açılamadı.');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Temassız QR İmza"
        subtitle="Müşteri Kendi Telefonundan İmzalasın"
        badgeText="TEMASSIZ"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* QR Kartı */}
        <View style={styles.qrCard}>
          <Text style={styles.qrCardTitle}>Kamerayı QR Koda Doğrultun</Text>
          <Text style={styles.qrCardSub}>Müşteri telefon kamerasıyla okutarak formu anında kendi ekranında açabilir.</Text>

          {/* Görsel QR Kutusu */}
          <View style={styles.qrFrame}>
            <Ionicons name="qr-code" size={180} color={COLORS.secondary} />
          </View>

          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{liveSignUrl}</Text>
          </View>
        </View>

        {/* Adım Adım Talimatlar */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instHeader}>NASIL ÇALIŞIR?</Text>

          <View style={styles.instRow}>
            <View style={styles.instStepCircle}><Text style={styles.instStepText}>1</Text></View>
            <Text style={styles.instText}>Müşteri telefon kamerasını ekrandaki QR koda tutar.</Text>
          </View>

          <View style={styles.instRow}>
            <View style={styles.instStepCircle}><Text style={styles.instStepText}>2</Text></View>
            <Text style={styles.instText}>Açılan güvenli web formunda taşınmaz detaylarını inceler.</Text>
          </View>

          <View style={styles.instRow}>
            <View style={styles.instStepCircle}><Text style={styles.instStepText}>3</Text></View>
            <Text style={styles.instText}>Kendi telefonunun ekranından parmağıyla imzalar.</Text>
          </View>
        </View>

        {/* WhatsApp Link Paylaşımı */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.whatsappLinkBtn}
          onPress={handleShareLink}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          <Text style={styles.whatsappLinkBtnText}>İmza Linkini WhatsApp'tan Gönder</Text>
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
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  qrCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  qrCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  qrFrame: {
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  linkBox: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  linkText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  instructionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  instHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  instRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  instStepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instStepText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  instText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  whatsappLinkBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  whatsappLinkBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
