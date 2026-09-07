import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { matchPropertyWithDemands } from '../services/matchService';
import { MatchResult, Property, BuyerDemand } from '../types';
import { Ionicons } from '@expo/vector-icons';

export const SmartMatchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [properties, setProperties] = useState<Property[]>(store.getProperties());
  const [demands, setDemands] = useState<BuyerDemand[]>(store.getDemands());
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');

  useEffect(() => {
    const refreshData = () => {
      const props = store.getProperties();
      const dems = store.getDemands();
      setProperties([...props]);
      setDemands([...dems]);
      if (!props.find(p => p.id === selectedPropId) && props.length > 0) {
        setSelectedPropId(props[0].id);
      }
    };

    const unsubStore = store.subscribe(refreshData);
    const unsubFocus = navigation.addListener('focus', refreshData);
    refreshData();

    return () => {
      unsubStore();
      unsubFocus();
    };
  }, [navigation, selectedPropId]);

  const selectedProperty = properties.find(p => p.id === selectedPropId) || properties[0];
  const matchResults: MatchResult[] = selectedProperty 
    ? matchPropertyWithDemands(selectedProperty, demands)
    : [];

  const handleNotifyBuyer = (match: MatchResult) => {
    if (!selectedProperty) return;
    const { demand } = match;
    const msg = `Merhaba ${demand.clientName} Bey/Hanım,\n\nAradığınız kriterlere (%${match.matchScore} eşleşen) yeni bir portföyümüz sisteme eklendi:\n\n📍 *${selectedProperty.title}*\n💰 Fiyat: ${selectedProperty.price} TL\n🏠 Özellik: ${selectedProperty.district} / ${selectedProperty.rooms || 'Daire'}\n\nMüsait olduğunuzda birlikte yerinde inceleyebiliriz.`;

    const phone = demand.clientPhone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=90${phone.startsWith('0') ? phone.slice(1) : phone}&text=${encodeURIComponent(msg)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Bilgi', 'WhatsApp açılamadı.');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Akıllı Alıcı Radarı"
        subtitle="Portföyü En Doğru Alıcıyla Eşleştir"
        badgeText="RADAR"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {properties.length === 0 ? (
          <View style={styles.emptyCardBig}>
            <Ionicons name="home-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyBigTitle}>Portföyünüzde Henüz Mülk Yok</Text>
            <Text style={styles.emptyBigSub}>
              Alıcı Radarı'nın portföylerinizi alıcı talepleriyle otomatik eşleştirebilmesi için Portföy Yönetimi ekranından mülk ekleyin.
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddBtn}
              onPress={() => navigation.navigate('Properties')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>Portföy Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Portföy Seçici */}
            <Text style={styles.sectionLabel}>EŞLEŞTİRİLECEK PORTFÖY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propScroll}>
              {properties.map(p => (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.8}
                  style={[styles.propChip, selectedPropId === p.id && styles.propChipActive]}
                  onPress={() => setSelectedPropId(p.id)}
                >
                  <Text style={[styles.propChipText, selectedPropId === p.id && styles.propChipTextActive]}>
                    {p.district} • {p.price} TL
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Seçilen Mülk Özeti */}
            {selectedProperty && (
              <View style={styles.selectedPropCard}>
                <View style={styles.propHeaderRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{selectedProperty.type}</Text>
                  </View>
                  <Text style={styles.propPriceText}>{selectedProperty.price} TL</Text>
                </View>
                <Text style={styles.propTitleText}>{selectedProperty.title}</Text>
                <Text style={styles.propLocText}>📍 {selectedProperty.district} / {selectedProperty.city}</Text>
              </View>
            )}

            {/* Eşleşen Alıcılar Başlığı */}
            <View style={styles.matchHeaderRow}>
              <Text style={styles.sectionLabel}>EŞLEŞEN ALICILAR ({matchResults.length})</Text>
            </View>

            {matchResults.map((match, index) => (
              <View key={index} style={styles.matchCard}>
                <View style={styles.matchCardTop}>
                  <View>
                    <Text style={styles.clientName}>{match.demand.clientName}</Text>
                    <Text style={styles.clientPhone}>{match.demand.clientPhone}</Text>
                  </View>
                  <View style={[styles.scoreBadge, match.matchScore >= 80 ? styles.scoreHigh : styles.scoreMedium]}>
                    <Text style={[styles.scoreText, match.matchScore >= 80 ? styles.scoreTextHigh : styles.scoreTextMedium]}>
                      %{match.matchScore} Uyum
                    </Text>
                  </View>
                </View>

                <View style={styles.reasonsList}>
                  {match.matchReasons.map((r, i) => (
                    <View key={i} style={styles.reasonRow}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.accentDark} />
                      <Text style={styles.reasonItemText}>{r}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.clientNote}>💬 Talep: "{match.demand.notes}"</Text>

                <TouchableOpacity 
                  activeOpacity={0.88}
                  style={styles.notifyBtn} 
                  onPress={() => handleNotifyBuyer(match)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.notifyBtnText}>Alıcıya WhatsApp'tan Gönder</Text>
                </TouchableOpacity>
              </View>
            ))}

            {matchResults.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="radio-outline" size={44} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>
                  {demands.length === 0 
                    ? "Henüz sisteme kayıtlı alıcı talebi bulunmuyor." 
                    : "Bu portföy kriterine uyan alıcı talebi bulunamadı."}
                </Text>
              </View>
            )}
          </>
        )}

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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  propScroll: {
    marginBottom: SPACING.md,
  },
  propChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  propChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  propChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  propChipTextActive: {
    color: '#FFFFFF',
  },
  selectedPropCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  propHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  propPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  propTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  propLocText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  matchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  matchCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  clientPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  scoreHigh: {
    backgroundColor: '#D1FAE5',
  },
  scoreMedium: {
    backgroundColor: '#FEF3C7',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scoreTextHigh: {
    color: '#065F46',
  },
  scoreTextMedium: {
    color: '#92400E',
  },
  reasonsList: {
    backgroundColor: COLORS.surfaceSubtle,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginVertical: 6,
    gap: 3,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonItemText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  clientNote: {
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  notifyBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
    marginTop: 6,
  },
  notifyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyCardBig: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyBigTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  emptyBigSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  emptyAddBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    ...SHADOWS.primaryGlow,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
