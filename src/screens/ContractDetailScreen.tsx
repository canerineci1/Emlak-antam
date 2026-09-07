import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { Contract } from '../types';
import { generateAndSharePdf, sendOwnerFeedbackWhatsApp } from '../services/contractService';
import { openTkgmParselSorgu, openPropertyOnGoogleMaps } from '../services/tkgmService';
import { Ionicons } from '@expo/vector-icons';

export const ContractDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const [contract, setContract] = useState<Contract>(route.params.contract);
  const [sharing, setSharing] = useState(false);

  const isYerGosterme = contract.type === 'YER_GOSTERME';
  const isKapora = contract.type === 'KAPORA_TEKLIFFORMU';
  const isCancelled = contract.status === 'CANCELLED';

  const handleSharePdf = async () => {
    setSharing(true);
    try {
      await generateAndSharePdf(contract);
    } catch (error) {
      Alert.alert('Hata', 'PDF paylaşılırken bir sorun oluştu.');
    } finally {
      setSharing(false);
    }
  };

  const handleCancelContract = () => {
    Alert.alert(
      'Sözleşmeyi İptal Et / Feshet',
      'Bu sözleşmeyi gerekçeli olarak iptal etmek istediğinizden emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: () => {
            setContract({ ...contract, status: 'CANCELLED' });
            Alert.alert('Bilgi', 'Sözleşme durumu İptal Edildi olarak güncellendi.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Sözleşme Detayı"
        subtitle={contract.property.title}
        badgeText={isCancelled ? 'İPTAL EDİLDİ' : 'GEÇERLİ'}
        onBack={() => navigation.navigate('HomeTab')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* DOĞRULAMA BANNERI */}
        <View style={[styles.verifiedBanner, isCancelled && styles.cancelledBanner]}>
          <View style={[styles.verifiedIconBox, isCancelled && { backgroundColor: '#FEE2E2' }]}>
            <Ionicons
              name={isCancelled ? "close-circle" : "checkmark-circle"}
              size={24}
              color={isCancelled ? COLORS.danger : COLORS.accentDark}
            />
          </View>
          <View style={styles.verifiedTextCol}>
            <Text style={[styles.verifiedTitle, isCancelled && { color: COLORS.danger }]}>
              {isCancelled ? 'SÖZLEŞME FESHEDİLDİ / İPTAL EDİLDİ' : 'HUKUKİ GEÇERLİ & TESCİLLİ'}
            </Text>
            <Text style={[styles.verifiedSub, isCancelled && { color: COLORS.danger }]}>
              {isCancelled ? 'İşlem tarafların mutabakatı ile sonlandırılmıştır.' : 'GPS konumu ve anlık zaman damgası ile arşivlenmiştir.'}
            </Text>
          </View>
        </View>

        {/* MÜŞTERİ & DANIŞMAN KARTI */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>TARAF VE DANIŞMAN BİLGİLERİ</Text>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Müşteri / Malik:</Text>
            <Text style={styles.rowValBold}>{contract.client.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>İletişim:</Text>
            <Text style={styles.rowVal}>{contract.client.phone}</Text>
          </View>
          {contract.client.idNumber ? (
            <View style={styles.row}>
              <Text style={styles.rowLbl}>T.C. Kimlik No:</Text>
              <Text style={styles.rowVal}>{contract.client.idNumber}</Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Danışman:</Text>
            <Text style={styles.rowValBold}>{contract.broker.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Ofis & Yetki No:</Text>
            <Text style={styles.rowVal}>{contract.broker.agencyName} ({contract.broker.licenseNumber})</Text>
          </View>
        </View>

        {/* TAŞINMAZ KARTI & TKGM HARİTA ENTEGRASYONU */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>TAŞINMAZ BİLGİLERİ</Text>
            <TouchableOpacity onPress={() => openTkgmParselSorgu(contract.property)}>
              <Text style={styles.tkgmLinkText}>TKGM Parsel Aç 🗺️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLbl}>İlan Başlığı:</Text>
            <Text style={styles.rowValBold} numberOfLines={1}>{contract.property.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Açık Adres:</Text>
            <Text style={styles.rowVal}>{contract.property.fullAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Ada / Parsel:</Text>
            <Text style={styles.rowValBold}>
              Ada: {contract.property.ada || '-'} | Parsel: {contract.property.parsel || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Fiyat:</Text>
            <Text style={[styles.rowValBold, { color: COLORS.primary }]}>{contract.property.price} TL</Text>
          </View>

          {/* Harita Butonları */}
          <View style={styles.mapsBtnRow}>
            <TouchableOpacity 
              style={styles.mapToolBtn}
              onPress={() => openPropertyOnGoogleMaps(contract.property)}
            >
              <Ionicons name="map-outline" size={14} color={COLORS.primary} />
              <Text style={styles.mapToolBtnText}>Google Haritalar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mapToolBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
              onPress={() => openTkgmParselSorgu(contract.property)}
            >
              <Ionicons name="navigate-outline" size={14} color={COLORS.primaryDark} />
              <Text style={[styles.mapToolBtnText, { color: COLORS.primaryDark }]}>TKGM Parsel Sorgu</Text>
            </TouchableOpacity>
          </View>

          {isKapora && contract.extras && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLbl}>Teklif Edilen Bedel:</Text>
                <Text style={[styles.rowValBold, { color: COLORS.accentDark }]}>
                  {contract.extras.offerPrice} TL
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLbl}>Kapora Tutarı:</Text>
                <Text style={styles.rowValBold}>{contract.extras.depositAmount} TL</Text>
              </View>
            </>
          )}
        </View>

        {/* DİJİTAL KANIT DAMGASI */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>DİJİTAL KANIT DAMGASI (HMK m. 199)</Text>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>İmza Zamanı:</Text>
            <Text style={styles.rowValBold}>{contract.signedAt}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>GPS Koordinatları:</Text>
            <Text style={styles.rowVal}>{contract.location.latitude.toFixed(5)}, {contract.location.longitude.toFixed(5)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Konum Tescili:</Text>
            <Text style={styles.rowVal} numberOfLines={1}>{contract.location.addressSnippet}</Text>
          </View>
        </View>

        {/* EYLEM BUTONLARI */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.whatsappButton}
          onPress={handleSharePdf}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.whatsappButtonText}>Müşteriye İmzalı PDF'i Gönder</Text>
            </>
          )}
        </TouchableOpacity>

        {isYerGosterme && !isCancelled && (
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.ownerReportButton}
            onPress={() => sendOwnerFeedbackWhatsApp(contract)}
          >
            <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
            <Text style={styles.ownerReportButtonText}>Mülk Sahibine Ziyaret Raporu Gönder</Text>
          </TouchableOpacity>
        )}

        {/* İPTAL / FESİH BUTONU */}
        {!isCancelled && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cancelContractBtn}
            onPress={handleCancelContract}
          >
            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.cancelContractBtnText}>Sözleşmeyi İptal Et / Feshet</Text>
          </TouchableOpacity>
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
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: SPACING.md,
    gap: 12,
  },
  cancelledBanner: {
    backgroundColor: COLORS.dangerLight,
    borderColor: '#FECACA',
  },
  verifiedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTextCol: {
    flex: 1,
  },
  verifiedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentDark,
    letterSpacing: 0.5,
  },
  verifiedSub: {
    fontSize: 11,
    color: COLORS.accentDark,
    marginTop: 2,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  tkgmLinkText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  mapsBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  mapToolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  mapToolBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLbl: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  rowVal: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1.5,
    textAlign: 'right',
    fontWeight: '500',
  },
  rowValBold: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1.5,
    textAlign: 'right',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xs,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  ownerReportButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.sm,
    ...SHADOWS.primaryGlow,
  },
  ownerReportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: COLORS.dangerLight,
    marginTop: SPACING.sm,
    gap: 6,
  },
  cancelContractBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
