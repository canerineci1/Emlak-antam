import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { Ionicons } from '@expo/vector-icons';

export const DigitalCardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const broker = store.getBroker();
  const properties = store.getProperties();

  const cardWebLink = `https://emlakcantam.app/@${broker.name.toLowerCase().replace(/\s+/g, '')}`;

  const handleShareCard = () => {
    const msg = `Merhaba,\n\nYetkili Emlak Danışmanınız *${broker.name}* (${broker.agencyName}) dijital kartvizit ve onaylı güncel portföy vitrini:\n\n🌐 ${cardWebLink}\n\n📞 İletişim: ${broker.phone}\n📜 Yetki Belgesi No: ${broker.licenseNumber}`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Bilgi', 'WhatsApp açılamadı.');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Dijital Broker Kartviziti"
        subtitle="Canlı Portföy Vitrini & NFC Paylaşımı"
        badgeText="VİTRİN"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* DİJİTAL KARTVİZİT KARTI */}
        <View style={styles.cardCover}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.avatarLarge}>
              <Ionicons name="business" size={36} color={COLORS.primary} />
            </View>
            <View style={styles.badgePill}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.accentDark} />
              <Text style={styles.badgePillText}>T.C. Yetki Belgeli</Text>
            </View>
          </View>

          <Text style={styles.brokerName}>{broker.name}</Text>
          <Text style={styles.agencyTitle}>{broker.agencyName}</Text>
          <Text style={styles.licenseNo}>Taşınmaz Ticareti Belge No: {broker.licenseNumber}</Text>

          {/* Hızlı İletişim İkonları */}
          <View style={styles.quickContactRow}>
            <TouchableOpacity 
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${broker.phone}`)}
            >
              <Ionicons name="call" size={16} color={COLORS.primary} />
              <Text style={styles.contactBtnText}>Ara</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
              onPress={() => Linking.openURL(`whatsapp://send?phone=90${broker.phone.replace(/[^0-9]/g, '')}`)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#15803D" />
              <Text style={[styles.contactBtnText, { color: '#15803D' }]}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`mailto:${broker.email}`)}
            >
              <Ionicons name="mail" size={16} color={COLORS.primary} />
              <Text style={styles.contactBtnText}>E-posta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PAYLAŞIM BUTONU */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.shareCardBtn}
          onPress={handleShareCard}
        >
          <Ionicons name="share-social" size={18} color="#FFFFFF" />
          <Text style={styles.shareCardBtnText}>Kartvizitimi & Portföy Vitrinimi Paylaş</Text>
        </TouchableOpacity>

        {/* VİTRİNDEKİ ONAYLI PORTFÖYLER */}
        <View style={styles.showcaseHeaderRow}>
          <Text style={styles.sectionLabel}>VİTRİNDEKİ AKTİF PORTFÖYLER ({properties.length})</Text>
        </View>

        {properties.map(p => (
          <View key={p.id} style={styles.propertyMiniCard}>
            <View style={styles.propMiniHeader}>
              <View style={[styles.typeBadge, p.type === 'SATILIK' ? styles.badgeSatilik : styles.badgeKiralik]}>
                <Text style={styles.typeBadgeText}>{p.type}</Text>
              </View>
              <Text style={styles.propPrice}>{p.price} TL</Text>
            </View>

            <Text style={styles.propTitle}>{p.title}</Text>
            <Text style={styles.propLoc}>📍 {p.district} / {p.city} • {p.rooms || 'Daire'}</Text>
          </View>
        ))}

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
  cardCover: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: '#059669',
  },
  badgePillText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  brokerName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  agencyTitle: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  licenseNo: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  shareCardBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.lg,
    ...SHADOWS.primaryGlow,
  },
  shareCardBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  showcaseHeaderRow: {
    marginBottom: SPACING.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
  },
  propertyMiniCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  propMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeSatilik: {
    backgroundColor: COLORS.primaryLight,
  },
  badgeKiralik: {
    backgroundColor: COLORS.amberLight,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  propPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  propTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  propLoc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
});
