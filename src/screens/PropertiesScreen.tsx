import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { Property } from '../types';
import { Ionicons } from '@expo/vector-icons';

export const PropertiesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [properties, setProperties] = useState<Property[]>(store.getProperties());
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubStore = store.subscribe(() => {
      setProperties([...store.getProperties()]);
    });
    const unsubFocus = navigation.addListener('focus', () => {
      setProperties([...store.getProperties()]);
    });
    setProperties([...store.getProperties()]);
    return () => {
      unsubStore();
      unsubFocus();
    };
  }, [navigation]);

  // Form State
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [rooms, setRooms] = useState('3+1');
  const [type, setType] = useState<'SATILIK' | 'KIRALIK'>('SATILIK');

  const handleAddProperty = () => {
    if (!title.trim() || !district.trim() || !address.trim() || !price.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    const newProp: Property = {
      id: `prop_${Date.now()}`,
      title,
      city,
      district,
      neighborhood: '',
      fullAddress: address,
      price,
      type,
      rooms,
      propertyCategory: 'DAIRE'
    };

    store.addProperty(newProp);
    setProperties([...store.getProperties()]);
    setModalVisible(false);

    // Reset Form
    setTitle('');
    setDistrict('');
    setAddress('');
    setPrice('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Portföy Yönetimi"
        subtitle={`${properties.length} Aktif Mülk Portföyde`}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Henüz Portföy Eklenmedi</Text>
            <Text style={styles.emptySub}>
              Sağ üstteki '+' butonuna basarak ilk gerçek taşınmazınızı portföyünüze ekleyin.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.propCard}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.typeBadge,
                item.type === 'SATILIK' ? styles.badgeSatilik : styles.badgeKiralik
              ]}>
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>
              <Text style={styles.priceText}>{item.price} TL</Text>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={13} color={COLORS.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.fullAddress}, {item.district} / {item.city}
              </Text>
            </View>

            {item.features && item.features.length > 0 && (
              <View style={styles.tagsRow}>
                {item.features.slice(0, 3).map((f, i) => (
                  <View key={i} style={styles.featureTag}>
                    <Text style={styles.featureTagText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.actionBtn}
                onPress={() => navigation.navigate('NewContract')}
              >
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Yer Göster</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionBtn, { backgroundColor: COLORS.violetLight, borderColor: '#DDD6FE' }]}
                onPress={() => navigation.navigate('AiCopywriter')}
              >
                <Ionicons name="sparkles" size={14} color={COLORS.violet} />
                <Text style={[styles.actionBtnText, { color: COLORS.violet }]}>AI İlan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionBtn, { backgroundColor: COLORS.accentLight, borderColor: '#A7F3D0' }]}
                onPress={() => navigation.navigate('SmartMatch')}
              >
                <Ionicons name="people" size={14} color={COLORS.accentDark} />
                <Text style={[styles.actionBtnText, { color: COLORS.accentDark }]}>Alıcı Eşle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Yeni Portföy Ekleme Modalı */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Portföy Ekle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Tür Seçimi */}
              <View style={styles.typeToggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, type === 'SATILIK' && styles.toggleActive]}
                  onPress={() => setType('SATILIK')}
                >
                  <Text style={[styles.toggleText, type === 'SATILIK' && styles.toggleActiveText]}>Satılık</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, type === 'KIRALIK' && styles.toggleActive]}
                  onPress={() => setType('KIRALIK')}
                >
                  <Text style={[styles.toggleText, type === 'KIRALIK' && styles.toggleActiveText]}>Kiralık</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="İlan / Portföy Başlığı *"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="İlçe (Örn: Kadıköy) *"
                placeholderTextColor={COLORS.textMuted}
                value={district}
                onChangeText={setDistrict}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Oda Sayısı (Örn: 3+1)"
                placeholderTextColor={COLORS.textMuted}
                value={rooms}
                onChangeText={setRooms}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Açık Adres (Sokak, Bina, No) *"
                placeholderTextColor={COLORS.textMuted}
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Fiyat (TL) *"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <TouchableOpacity activeOpacity={0.88} style={styles.saveModalBtn} onPress={handleAddProperty}>
                <Text style={styles.saveModalBtnText}>Portföyü Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primaryGlow,
  },
  propCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  featureTag: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  featureTagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
  },
  toggleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  toggleActiveText: {
    color: COLORS.primaryDark,
  },
  modalInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: SPACING.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  saveModalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
    ...SHADOWS.primaryGlow,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
