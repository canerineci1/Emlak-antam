import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Contract } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ContractCardProps {
  contract: Contract;
  onPress: () => void;
  onShare: () => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({ contract, onPress, onShare }) => {
  const isYerGosterme = contract.type === 'YER_GOSTERME';
  const isKapora = contract.type === 'KAPORA_TEKLIFFORMU';
  const isYetki = contract.type === 'YETKI_BELGESI';

  const badgeColor = isYerGosterme 
    ? { bg: COLORS.primaryLight, text: COLORS.primaryDark, border: COLORS.primaryMuted, label: 'Yer Gösterme' }
    : isKapora 
    ? { bg: COLORS.accentLight, text: COLORS.accentDark, border: '#A7F3D0', label: 'Teklif & Kapora' }
    : { bg: COLORS.violetLight, text: COLORS.violet, border: '#DDD6FE', label: 'Yetki Sözleşmesi' };

  const initials = (contract.client.name || 'M')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity 
      activeOpacity={0.88} 
      style={styles.card} 
      onPress={onPress}
    >
      {/* Top Row: Type Badge + Date */}
      <View style={styles.topRow}>
        <View style={[styles.typeBadge, { backgroundColor: badgeColor.bg, borderColor: badgeColor.border }]}>
          <View style={[styles.typeDot, { backgroundColor: badgeColor.text }]} />
          <Text style={[styles.typeBadgeText, { color: badgeColor.text }]}>{badgeColor.label}</Text>
        </View>

        <View style={styles.dateBadge}>
          <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.dateText}>{contract.signedAt}</Text>
        </View>
      </View>

      {/* Property Title & Price */}
      <View style={styles.middleSection}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {contract.property.title}
        </Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={13} color={COLORS.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {contract.location.addressSnippet || `${contract.property.district}, ${contract.property.city}`}
          </Text>
        </View>
      </View>

      {/* Client Avatar + Info */}
      <View style={styles.clientSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.clientDetails}>
          <Text style={styles.clientName}>{contract.client.name}</Text>
          <Text style={styles.clientPhone}>{contract.client.phone}</Text>
        </View>

        {isKapora && contract.extras?.offerPrice && (
          <View style={styles.priceTag}>
            <Text style={styles.priceTagLabel}>Teklif</Text>
            <Text style={styles.priceTagValue}>{contract.extras.offerPrice} TL</Text>
          </View>
        )}
      </View>

      {/* Footer: GPS Stamp & PDF Share Button */}
      <View style={styles.footerRow}>
        <View style={styles.verifiedStamp}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
          <Text style={styles.verifiedText}>GPS & İmzalı</Text>
        </View>

        <TouchableOpacity 
          style={styles.shareBtn} 
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={14} color={COLORS.primary} />
          <Text style={styles.shareBtnText}>PDF Paylaş</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 5,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  middleSection: {
    marginVertical: 2,
  },
  propertyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginVertical: SPACING.sm,
    gap: 10,
    flexWrap: 'wrap',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  clientPhone: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceTagLabel: {
    fontSize: 10,
    color: COLORS.accentDark,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceTagValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  verifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: COLORS.accentDark,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  shareBtnText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
});
