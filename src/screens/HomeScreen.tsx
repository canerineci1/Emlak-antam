import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { ContractCard } from '../components/ContractCard';
import { store } from '../services/storageService';
import { Contract, ContractType } from '../types';
import { generateAndSharePdf } from '../services/contractService';
import { exportContractsToCSV } from '../services/exportService';
import { subscribeAuth, getCurrentUser, UserProfile } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | ContractType>('ALL');

  const broker = store.getBroker();

  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());

  useEffect(() => {
    const unsubAuth = subscribeAuth(user => setCurrentUser(user));
    const unsubStore = store.subscribe(() => {
      setContracts([...store.getContracts()]);
    });
    const unsubscribe = navigation.addListener('focus', () => {
      setContracts([...store.getContracts()]);
    });
    setContracts([...store.getContracts()]);
    return () => {
      unsubAuth();
      unsubStore();
      unsubscribe();
    };
  }, [navigation]);

  const handleShare = async (contract: Contract) => {
    try {
      await generateAndSharePdf(contract);
    } catch (error) {
      console.warn('Paylaşım hatası:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportContractsToCSV(contracts);
    } catch (error) {
      Alert.alert('Hata', 'CSV dışa aktarılırken bir sorun oluştu.');
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesFilter = selectedFilter === 'ALL' || c.type === selectedFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      c.client.name.toLowerCase().includes(query) ||
      c.client.phone.includes(query) ||
      c.property.title.toLowerCase().includes(query) ||
      c.property.district.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* Header */}
      <Header
        title="EmlakÇantam"
        subtitle={`${currentUser.agencyName} • ${currentUser.name}`}
        badgeText={currentUser.role === 'YONETICI' ? 'BROKER' : 'DANIŞMAN'}
        rightAction={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {currentUser.role === 'YONETICI' && (
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate('TeamManagement')}
              >
                <Ionicons name="people-outline" size={17} color={COLORS.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('DigitalCard')}
            >
              <Ionicons name="card-outline" size={17} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.headerIconBtn}
              onPress={handleExportCSV}
            >
              <Ionicons name="download-outline" size={17} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. HERO QUICK ACTION: YENİ YER GÖSTERME */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.heroActionCard}
          onPress={() => navigation.navigate('NewContract')}
        >
          <View style={styles.heroLeft}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>HIZLI SAHA İŞLEMİ</Text>
            </View>
            <Text style={styles.heroTitle}>Yeni Belge Düzenle</Text>
            <Text style={styles.heroSub}>Yer Gösterme, Kapora & Yetki Sözleşmesi</Text>
          </View>
          <View style={styles.heroIconCircle}>
            <Ionicons name="add" size={28} color={COLORS.surface} />
          </View>
        </TouchableOpacity>

        {/* BROKER VEYA DANIŞMAN BANNERI */}
        {currentUser.role === 'YONETICI' ? (
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.brokerBanner}
            onPress={() => navigation.navigate('TeamManagement')}
          >
            <View style={styles.brokerBannerIcon}>
              <Ionicons name="briefcase" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.brokerBannerTitle}>Ofis & Danışman Takip Paneli</Text>
              <Text style={styles.brokerBannerSub}>Haftalık müşteri görüşmeleri, sözleşmeler ve yönetici raporu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.brokerBanner, { borderColor: '#A7F3D0' }]}>
            <View style={[styles.brokerBannerIcon, { backgroundColor: '#059669' }]}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.brokerBannerTitle}>Saha Danışmanı Modu</Text>
              <Text style={styles.brokerBannerSub}>{currentUser.name ? `${currentUser.name} • ` : ''}{contracts.length} Düzenlenen Sözleşme</Text>
            </View>
          </View>
        )}

        {/* 2. SÜPER ARAÇLAR GRIDI (9 İleri Düzey Araç) */}
        <Text style={styles.sectionLabel}>EMLAK SAHA VE PAZARLAMA ARAÇLARI</Text>
        <View style={styles.bentoGrid}>
          {/* Tahliye Taahhüdü */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={() => navigation.navigate('Eviction')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: '#DC2626' }]}>
              <Ionicons name="document-text" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>Tahliye Taahhüdü</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>TBK m. 352</Text>
          </TouchableOpacity>

          {/* Emsal Değerleme (CMA) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            onPress={() => navigation.navigate('Valuation')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="analytics" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>Emsal Değerleme</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>CMA Ekspertiz</Text>
          </TouchableOpacity>

          {/* Müşteri Rehberi (Lead Hub) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
            onPress={() => navigation.navigate('LeadHub')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: '#059669' }]}>
              <Ionicons name="people" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>Müşteri Rehberi</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>CRM Leads</Text>
          </TouchableOpacity>

          {/* Sesli Not AI */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}
            onPress={() => navigation.navigate('VoiceMemo')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: '#9333EA' }]}>
              <Ionicons name="mic" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>Sesli Not AI</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>Whisper Large v3</Text>
          </TouchableOpacity>

          {/* Alıcı Radarı */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: COLORS.accentLight, borderColor: '#A7F3D0' }]}
            onPress={() => navigation.navigate('SmartMatch')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: COLORS.accent }]}>
              <Ionicons name="locate" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>Alıcı Radarı</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>Akıllı Eşleşme</Text>
          </TouchableOpacity>

          {/* AI İlan & Reels */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: COLORS.violetLight, borderColor: '#DDD6FE' }]}
            onPress={() => navigation.navigate('AiCopywriter')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: COLORS.violet }]}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>AI İlan & Reels</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>Sosyal Medya</Text>
          </TouchableOpacity>

          {/* Yasal Kira Artış Motoru */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            onPress={() => navigation.navigate('RentIncrease')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: '#16A34A' }]}>
              <Ionicons name="trending-up" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>Kira Artışı</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>TÜİK TÜFE Tavanı</Text>
          </TouchableOpacity>

          {/* Harç & Kredi Motoru */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
            onPress={() => navigation.navigate('Calculator')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: '#D97706' }]}>
              <Ionicons name="calculator" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>Harç & Kredi</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>%4 Tapu Harcı</Text>
          </TouchableOpacity>

          {/* Demirbaş Teslim Tutanağı */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bentoCard, isSmallScreen && styles.bentoCardSmall, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}
            onPress={() => navigation.navigate('Inventory')}
          >
            <View style={[styles.bentoIconBox, { backgroundColor: '#DB2777' }]}>
              <Ionicons name="clipboard" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.bentoTitle} numberOfLines={1}>Demirbaş Tutanağı</Text>
            <Text style={styles.bentoSub} numberOfLines={1}>Sayaç & Hasar</Text>
          </TouchableOpacity>
        </View>

        {/* 3. ARAMA ÇUBUĞU */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Müşteri adı, telefon veya portföy ara..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 4. TÜR FİLTRELEME HAPLARI */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'ALL' && styles.filterChipTextActive]}>
              Tümü ({contracts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.filterChip, selectedFilter === 'YER_GOSTERME' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('YER_GOSTERME')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'YER_GOSTERME' && styles.filterChipTextActive]}>
              Yer Gösterme ({contracts.filter(c => c.type === 'YER_GOSTERME').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.filterChip, selectedFilter === 'KAPORA_TEKLIFFORMU' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('KAPORA_TEKLIFFORMU')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'KAPORA_TEKLIFFORMU' && styles.filterChipTextActive]}>
              Kapora & Teklif ({contracts.filter(c => c.type === 'KAPORA_TEKLIFFORMU').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.filterChip, selectedFilter === 'YETKI_BELGESI' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('YETKI_BELGESI')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'YETKI_BELGESI' && styles.filterChipTextActive]}>
              Yetki ({contracts.filter(c => c.type === 'YETKI_BELGESI').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 5. SON İMZALANAN BELGELER BAŞLIĞI */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>İmzalı Sözleşmeler ({filteredContracts.length})</Text>
          <TouchableOpacity onPress={handleExportCSV}>
            <Text style={styles.exportText}>Excel'e Aktar 📊</Text>
          </TouchableOpacity>
        </View>

        {/* 6. BELGE KARTLARI LİSTESİ */}
        {filteredContracts.map(item => (
          <ContractCard
            key={item.id}
            contract={item}
            onPress={() => navigation.navigate('ContractDetail', { contract: item })}
            onShare={() => handleShare(item)}
          />
        ))}

        {filteredContracts.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name={contracts.length === 0 ? "document-text-outline" : "search-outline"} size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {contracts.length === 0 ? "Henüz İmzalı Sözleşme Yok" : "Aramaya Uygun Belge Bulunamadı"}
            </Text>
            <Text style={styles.emptySub}>
              {contracts.length === 0 
                ? "Yeni Belge Düzenle butonuna dokunarak ilk Yer Gösterme veya Yetki Sözleşmenizi oluşturabilirsiniz."
                : "Arama filtrenizi temizleyin veya yeni bir sözleşme oluşturun."}
            </Text>
          </View>
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
  scrollContent: {
    padding: SPACING.md,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  heroActionCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    ...SHADOWS.primaryGlow,
  },
  heroLeft: {
    flex: 1,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  brokerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  brokerBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brokerBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  brokerBannerSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  bentoCard: {
    width: '31.3%',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
  },
  bentoCardSmall: {
    width: '48.5%',
  },
  bentoIconBox: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  bentoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  bentoSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 42,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    maxHeight: 36,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  exportText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 3,
  },
});
