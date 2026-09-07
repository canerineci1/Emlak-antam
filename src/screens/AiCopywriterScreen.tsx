import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { generateAiMarketingContent, AiCopyResult } from '../services/aiService';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

export const AiCopywriterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const properties = store.getProperties();
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');
  const [extraFeatures, setExtraFeatures] = useState('Deniz manzaralı, ebeveyn banyolu, metroya 5 dk');
  const [activeTab, setActiveTab] = useState<'portal' | 'reels' | 'whatsapp'>('portal');
  const [aiResult, setAiResult] = useState<AiCopyResult | null>(null);

  const handleGenerate = () => {
    const prop = properties.find(p => p.id === selectedPropId);
    if (!prop) {
      Alert.alert('Hata', 'Lütfen bir portföy seçiniz.');
      return;
    }

    const highlights = extraFeatures.split(',').map(s => s.trim()).filter(Boolean);
    const result = generateAiMarketingContent(prop, highlights);
    setAiResult(result);
  };

  const handleCopyToast = () => {
    Alert.alert('Kopyalandı', 'Metin panoya kopyalandı, dilediğiniz yere yapıştırabilirsiniz.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="AI İlan Metin Fabrikası"
        subtitle="10 Saniyede Satış Odaklı Emlak İçeriği"
        badgeText="YAPAY ZEKA"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* Portföy Seçimi */}
        <Text style={styles.sectionLabel}>1. İLANI HAZIRLANACAK PORTFÖY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propScroll}>
          {properties.map(p => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.8}
              style={[styles.propChip, selectedPropId === p.id && styles.propChipActive]}
              onPress={() => {
                setSelectedPropId(p.id);
                setAiResult(null);
              }}
            >
              <Text style={[styles.propChipText, selectedPropId === p.id && styles.propChipTextActive]}>
                {p.district} • {p.rooms || 'Daire'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vurgulanacak Özellikler */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>2. VURGULANACAK ÖZELLİKLER</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            value={extraFeatures}
            onChangeText={setExtraFeatures}
            placeholder="Örn: Deniz manzaralı, krediye uygun, kapalı otopark"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* AI Üret Butonu */}
        <TouchableOpacity 
          activeOpacity={0.88}
          style={styles.generateBtn} 
          onPress={handleGenerate}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          <Text style={styles.generateBtnText}>Yapay Zeka ile Metinleri Üret</Text>
        </TouchableOpacity>

        {/* Sonuç Alanı */}
        {aiResult && (
          <View style={styles.resultContainer}>
            {/* Format Sekmeleri */}
            <View style={styles.segmentedTabRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tabBtn, activeTab === 'portal' && styles.tabBtnActive]}
                onPress={() => setActiveTab('portal')}
              >
                <Ionicons name="browsers" size={15} color={activeTab === 'portal' ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.tabBtnText, activeTab === 'portal' && styles.tabBtnTextActive]}>Portal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tabBtn, activeTab === 'reels' && styles.tabBtnActive]}
                onPress={() => setActiveTab('reels')}
              >
                <Ionicons name="videocam" size={15} color={activeTab === 'reels' ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.tabBtnText, activeTab === 'reels' && styles.tabBtnTextActive]}>Reels</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tabBtn, activeTab === 'whatsapp' && styles.tabBtnActive]}
                onPress={() => setActiveTab('whatsapp')}
              >
                <Ionicons name="logo-whatsapp" size={15} color={activeTab === 'whatsapp' ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.tabBtnText, activeTab === 'whatsapp' && styles.tabBtnTextActive]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {/* Çıktı Kartı */}
            <View style={styles.outputCard}>
              <View style={styles.outputHeaderRow}>
                <Text style={styles.outputHeaderTitle}>
                  {activeTab === 'portal' ? 'Portal İlan Metni' : activeTab === 'reels' ? 'Instagram Video Kurgusu' : 'WhatsApp Portföy Bülteni'}
                </Text>
                <TouchableOpacity onPress={handleCopyToast} style={styles.copyBtn}>
                  <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.copyBtnText}>Kopyala</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'portal' && (
                <>
                  <Text style={styles.outputTitleSnippet}>{aiResult.portalTitle}</Text>
                  <Text style={styles.outputBodySnippet}>{aiResult.portalDescription}</Text>
                </>
              )}

              {activeTab === 'reels' && (
                <>
                  <Text style={styles.outputBodySnippet}>{aiResult.reelsScript}</Text>
                  <Text style={styles.hashtagSnippet}>{aiResult.reelsHashtags}</Text>
                </>
              )}

              {activeTab === 'whatsapp' && (
                <Text style={styles.outputBodySnippet}>{aiResult.whatsappBroadcast}</Text>
              )}
            </View>
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
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  propScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  propChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
    ...SHADOWS.sm,
  },
  propChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  propChipText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  propChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  generateBtn: {
    backgroundColor: COLORS.violet,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  resultContainer: {
    marginTop: SPACING.lg,
  },
  segmentedTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  outputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  outputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  outputHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  outputTitleSnippet: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    backgroundColor: COLORS.surfaceSubtle,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  outputBodySnippet: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
    backgroundColor: COLORS.surfaceSubtle,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  hashtagSnippet: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '600',
  },
});
