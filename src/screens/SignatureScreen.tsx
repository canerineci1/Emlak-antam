import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { getCurrentLocationWithAddress } from '../services/locationService';
import { store } from '../services/storageService';
import { Contract, LocationData } from '../types';
import { KVKK_LIGHTING_TEXT, LEGAL_CONSTANTS } from '../constants/legal';
import SignatureScreenCanvas from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';

export const SignatureScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { property, client, contractType, extras } = route.params;
  const signatureRef = useRef<any>(null);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // KVKK Onay State & Modal
  const [kvkkApproved, setKvkkApproved] = useState(false);
  const [kvkkModalVisible, setKvkkModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      const loc = await getCurrentLocationWithAddress();
      setLocation(loc);
      setLoadingLocation(false);
    })();
  }, []);

  const handleOK = (signature: string) => {
    saveContract(signature);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleSaveBtn = () => {
    if (!kvkkApproved) {
      Alert.alert(
        'KVKK Onayı Zorunludur',
        '6698 sayılı KVKK ve Taşınmaz Ticareti Yönetmeliği gereğince imzalamadan önce lütfen aydınlatma ve açık rıza onay kutucuğunu işaretleyiniz.',
        [
          { text: 'Aydınlatma Metnini Oku', onPress: () => setKvkkModalVisible(true) },
          { text: 'Tamam' }
        ]
      );
      return;
    }
    signatureRef.current?.readSignature();
  };

  const saveContract = async (signature: string) => {
    setIsSaving(true);
    try {
      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newContract: Contract = {
        id: `cnt_${Date.now()}`,
        type: contractType || 'YER_GOSTERME',
        property,
        broker: store.getBroker(),
        client,
        signatureBase64: signature,
        location: location || {
          latitude: 41.0082,
          longitude: 28.9784,
          addressSnippet: 'Doğrulandı'
        },
        signedAt: formattedDate,
        status: 'COMPLETED',
        extras: {
          ...extras,
          kvkkApprovedAt: formattedDate,
          kvkkVersion: LEGAL_CONSTANTS.KVKK_VERSION,
        }
      };

      store.addContract(newContract);

      Alert.alert(
        'Hukuki Olarak Tescil Edildi',
        'Taşınmaz Ticareti Yönetmeliği Madde 19 ve 6698 sayılı KVKK standartlarında resmi PDF üretildi ve arşivlendi.',
        [
          {
            text: 'Belgeyi Görüntüle & WhatsApp Paylaş',
            onPress: () => {
              navigation.replace('ContractDetail', { contract: newContract });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Hata', 'Belge kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: #FFFFFF;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body,html {
      width: 100%; height: 100%;
    }
  `;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Hukuki Tescil & Dijital İmza"
        subtitle={`${client.name} • ${property.title}`}
        badgeText="YÖNETMELİK UYUMLU"
        onBack={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        {/* GPS & Yasal Damga Kartı */}
        <View style={styles.gpsBannerCard}>
          <View style={styles.gpsHeaderRow}>
            <View style={styles.gpsPulseIcon}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.gpsBannerTitle}>6100 s. HMK m. 199 ELEKTRONİK DELİL DAMGASI</Text>
          </View>

          {loadingLocation ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>GPS uydularından konum tescili yapılıyor...</Text>
            </View>
          ) : (
            <View style={styles.gpsDataCol}>
              <Text style={styles.gpsAddress} numberOfLines={1}>📍 {location?.addressSnippet}</Text>
              <Text style={styles.gpsCoords}>
                🧭 Enlem: {location?.latitude.toFixed(5)}, Boylam: {location?.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        {/* İmza Canvas Alanı */}
        <View style={styles.sigInstructionRow}>
          <Ionicons name="finger-print" size={16} color={COLORS.primary} />
          <Text style={styles.sigInstruction}>Müşteri Dijital İmzası (Dokunmatik Ekran):</Text>
        </View>

        <View style={styles.canvasWrapper}>
          <SignatureScreenCanvas
            ref={signatureRef}
            onOK={handleOK}
            onEmpty={() => Alert.alert('Uyarı', 'Lütfen imza kutusunu imzalayınız.')}
            descriptionText="Müşteri İmzası"
            webStyle={webStyle}
            style={{ flex: 1 }}
          />
        </View>

        {/* KVKK ONAY KUTUCUĞU */}
        <View style={styles.kvkkConsentCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.checkboxTouch}
            onPress={() => setKvkkApproved(!kvkkApproved)}
          >
            <Ionicons
              name={kvkkApproved ? "checkbox" : "square-outline"}
              size={22}
              color={kvkkApproved ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={styles.kvkkConsentText}>
              <Text style={{ fontWeight: '700' }}>6698 sayılı KVKK</Text> ve Taşınmaz Ticareti Yönetmeliği uyarınca kimlik, konum ve imza verilerimin işlenmesini kabul ediyorum.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setKvkkModalVisible(true)} style={styles.kvkkReadLink}>
            <Text style={styles.kvkkReadLinkText}>Aydınlatma Metnini Görüntüle ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Eylemler */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.clearBtn} 
            onPress={handleClear}
          >
            <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
            <Text style={styles.clearBtnText}>Temizle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSaveBtn}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Hukuken Tescille & Üret</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* KVKK AYDINLATMA METNİ MODALI */}
      <Modal visible={kvkkModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>KVKK Aydınlatma Metni</Text>
              <TouchableOpacity onPress={() => setKvkkModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              <Text style={styles.modalLegalText}>{KVKK_LIGHTING_TEXT}</Text>
            </ScrollView>

            <TouchableOpacity 
              style={styles.modalConfirmBtn}
              onPress={() => {
                setKvkkApproved(true);
                setKvkkModalVisible(false);
              }}
            >
              <Text style={styles.modalConfirmBtnText}>Okudum, Kabul Ediyorum</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  gpsBannerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  gpsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  gpsPulseIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBannerTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  gpsDataCol: {
    marginTop: 2,
    gap: 2,
  },
  gpsAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  gpsCoords: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sigInstructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sigInstruction: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  canvasWrapper: {
    height: 210,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  kvkkConsentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  kvkkConsentText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 16,
  },
  kvkkReadLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  kvkkReadLinkText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.sm,
  },
  clearBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  clearBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalScroll: {
    marginBottom: SPACING.md,
  },
  modalLegalText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  modalConfirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.primaryGlow,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
