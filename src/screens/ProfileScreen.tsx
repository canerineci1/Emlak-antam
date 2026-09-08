import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { store } from '../services/storageService';
import { Ionicons } from '@expo/vector-icons';
import { getSavedFirebaseConfig, saveFirebaseConfig, FirebaseCustomConfig } from '../services/firebaseSyncService';
import { getCurrentUser, subscribeAuth, switchRole, logout, UserProfile } from '../services/authService';
import { checkFirebaseConnection, FirebaseConnectionStatus } from '../config/firebase';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const currentBroker = store.getBroker();

  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());

  const [name, setName] = useState(currentBroker.name);
  const [tcKimlikNo, setTcKimlikNo] = useState(currentBroker.tcKimlikNo || '');
  const [agencyName, setAgencyName] = useState(currentBroker.agencyName);
  const [licenseNumber, setLicenseNumber] = useState(currentBroker.licenseNumber);
  const [phone, setPhone] = useState(currentBroker.phone);
  const [email, setEmail] = useState(currentBroker.email);

  // Firebase Config State
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseCustomConfig | null>(null);
  const [liveFbStatus, setLiveFbStatus] = useState<FirebaseConnectionStatus | null>(null);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');

  useEffect(() => {
    loadFbConfig();
    checkFirebaseConnection().then(status => setLiveFbStatus(status));
    const unsub = subscribeAuth(user => setCurrentUser(user));
    return unsub;
  }, []);

  const loadFbConfig = async () => {
    const cfg = await getSavedFirebaseConfig();
    if (cfg) {
      setFirebaseConfig(cfg);
      setApiKey(cfg.apiKey || '');
      setProjectId(cfg.projectId || '');
      setStorageBucket(cfg.storageBucket || '');
    }
  };

  const handleSave = () => {
    store.updateBroker({
      name,
      tcKimlikNo,
      agencyName,
      licenseNumber,
      phone,
      email,
    });

    Alert.alert('Başarılı', 'Broker ve işletme yasal bilgileriniz güncellendi. Tüm yeni sözleşmelere resmi mevzuat uyarınca yansıyacaktır.');
  };

  const handleSaveFirebase = async () => {
    if (!projectId) {
      Alert.alert('Eksik Bilgi', 'Lütfen en azından Firebase Proje ID (Project ID) giriniz.');
      return;
    }

    const newCfg: FirebaseCustomConfig = {
      apiKey: apiKey || 'AIzaSy-DEFAULT-KEY',
      authDomain: `${projectId}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId}.appspot.com`,
      messagingSenderId: '123456789',
      appId: `1:123456789:web:${projectId}`
    };

    const success = await saveFirebaseConfig(newCfg);
    if (success) {
      setFirebaseConfig(newCfg);
      setShowFirebaseModal(false);
      Alert.alert('🎉 Firebase Bağlandı!', `Proje: "${projectId}" başarıyla kaydedildi. Verileriniz artık bulutta yedeklenecektir.`);
    }
  };

  const handleSwitchRole = () => {
    const target = currentUser.role === 'YONETICI' ? 'DANISMAN' : 'YONETICI';
    const targetName = target === 'YONETICI' ? 'Ofis Sahibi / Broker' : 'Gayrimenkul Danışmanı';
    Alert.alert(
      'Rol Değiştir',
      `Hesabınızı "${targetName}" moduna geçirmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Rolü Değiştir',
          onPress: async () => {
            await switchRole(target);
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Oturumu Kapat',
      'EmlakÇantam oturumunuzu kapatmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Broker & Ofis Yasal Profili"
        subtitle="Taşınmaz Ticareti Yönetmeliği Tescilli"
        badgeText={currentUser.role === 'YONETICI' ? 'BROKER' : 'DANIŞMAN'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* 1. OTURUM AÇAN KULLANICI & ROL KARTI */}
        <View style={styles.userCard}>
          <View style={styles.userHeaderRow}>
            <View style={styles.userAvatarBox}>
              <Ionicons
                name={currentUser.role === 'YONETICI' ? 'business' : 'person'}
                size={24}
                color={COLORS.primary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.userNameText}>{currentUser.name}</Text>
              <Text style={styles.userEmailText}>{currentUser.email}</Text>
              <View style={[styles.rolePill, currentUser.role === 'YONETICI' ? styles.rolePillManager : styles.rolePillAgent]}>
                <Text style={[styles.rolePillText, currentUser.role === 'YONETICI' ? styles.roleTextManager : styles.roleTextAgent]}>
                  {currentUser.role === 'YONETICI' ? '🏢 Ofis Sahibi / Broker' : '👤 Saha Danışmanı'}
                </Text>
              </View>
            </View>
          </View>

          {/* ROL DEĞİŞTİR BUTONU */}
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={handleSwitchRole}
          >
            <Ionicons name="swap-horizontal" size={15} color={COLORS.primary} />
            <Text style={styles.switchRoleBtnText}>
              {currentUser.role === 'YONETICI' ? 'Danışman Moduna Geç' : 'Broker / Yönetici Moduna Geç'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. FIREBASE BULUT YEDEKLEME KARTI */}
        <View style={styles.cloudCard}>
          <View style={styles.cloudHeader}>
            <View style={styles.cloudIconBox}>
              <Ionicons name="cloud-done" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.cloudTitle}>Firebase Bulut Entegrasyonu</Text>
                <View style={[styles.statusBadge, styles.statusBadgeOnline]}>
                  <Text style={[styles.statusBadgeText, styles.statusTextOnline]}>
                    {liveFbStatus?.firestoreStatus === 'CONNECTED'
                      ? '🟢 Buluta Bağlı'
                      : liveFbStatus?.firestoreStatus === 'PERMISSION_DENIED'
                      ? '🟡 İzin Bekleniyor'
                      : '🟢 Proje Aktif'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cloudSub}>
                Proje: {firebaseConfig?.projectId || 'emlakcantam1'} • {liveFbStatus?.message || 'Firestore ve Auth bulut senkronizasyonu devrede.'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.cloudConfigBtn, { flex: 1 }]}
              onPress={() => {
                Alert.alert('Bağlantı Test Ediliyor', 'Firebase sunucuları kontrol ediliyor...');
                checkFirebaseConnection().then(st => {
                  setLiveFbStatus(st);
                  Alert.alert(
                    st.isConnected ? '✅ Firebase Bağlantısı Başarılı' : '⚠️ Bağlantı Notu',
                    `Proje: emlakcantam1\n\nFirestore Durumu: ${st.firestoreStatus}\nAuth Durumu: ${st.authStatus}\n\nMesaj: ${st.message}`
                  );
                });
              }}
            >
              <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
              <Text style={styles.cloudConfigBtnText}>Bağlantıyı Test Et</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cloudConfigBtn, { flex: 1 }]}
              onPress={() => setShowFirebaseModal(true)}
            >
              <Ionicons name="settings-outline" size={14} color={COLORS.primary} />
              <Text style={styles.cloudConfigBtnText}>Özel Proje Gir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. İŞLETME VE BROKER BİLGİLERİ FORMU */}
        <Text style={styles.sectionLabel}>İŞLETME VE YASAL BİLGİLER</Text>
        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Taşınmaz Ticareti Yetki Belge No (Zorunlu) *</Text>
            <TextInput
              style={styles.input}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Örn: 3400123"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>İşletme / Acente Ticari Unvanı *</Text>
            <TextInput
              style={styles.input}
              value={agencyName}
              onChangeText={setAgencyName}
              placeholder="Örn: EmlakÇantam Gayrimenkul Danışmanlık"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sorumlu Emlak Danışmanı Ad Soyad *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Adınız Soyadınız"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Danışman T.C. Kimlik No *</Text>
            <TextInput
              style={styles.input}
              value={tcKimlikNo}
              onChangeText={setTcKimlikNo}
              keyboardType="numeric"
              maxLength={11}
              placeholder="11 haneli T.C. Kimlik No"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>İletişim Telefonu *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Örn: 0532 123 45 67"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.fieldGroupLast}>
            <Text style={styles.label}>E-posta Adresi</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Örn: info@ofis.com"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* KAYDET BUTONU */}
        <TouchableOpacity activeOpacity={0.88} style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="save" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Yasal Bilgileri Kaydet</Text>
        </TouchableOpacity>

        {/* OTURUMU KAPAT BUTONU */}
        <TouchableOpacity activeOpacity={0.88} style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutBtnText}>Oturumu Kapat (Çıkış Yap)</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FIREBASE BAĞLANTI MODALI */}
      <Modal visible={showFirebaseModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Firebase Bulut Kurulumu</Text>
                <Text style={styles.modalSub}>Google Firebase Console bilgilerinizi giriniz</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFirebaseModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Firebase Project ID (Proje Kimliği) *</Text>
              <TextInput
                style={styles.modalInput}
                value={projectId}
                onChangeText={setProjectId}
                placeholder="Örn: emlakofisim-app"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Firebase Web API Key</Text>
              <TextInput
                style={styles.modalInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="AIzaSy..."
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Storage Bucket (Depolama Alanı)</Text>
              <TextInput
                style={styles.modalInput}
                value={storageBucket}
                onChangeText={setStorageBucket}
                placeholder="Örn: emlakofisim-app.appspot.com"
                autoCapitalize="none"
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Firebase Console'dan oluşturduğunuz projenin Project ID bilgisini girmeniz yeterlidir.
                </Text>
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveFirebase}>
                <Text style={styles.modalSaveBtnText}>Bulut Bağlantısını Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
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
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  userEmailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  rolePillManager: {
    backgroundColor: '#EFF6FF',
  },
  rolePillAgent: {
    backgroundColor: '#ECFDF5',
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roleTextManager: {
    color: COLORS.primary,
  },
  roleTextAgent: {
    color: '#059669',
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
    gap: 6,
  },
  switchRoleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cloudCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cloudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloudIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusBadgeOnline: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeDemo: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextOnline: {
    color: '#059669',
  },
  statusTextDemo: {
    color: '#D97706',
  },
  cloudSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cloudConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    marginTop: SPACING.sm,
    gap: 6,
  },
  cloudConfigBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  fieldGroup: {
    marginBottom: SPACING.sm,
  },
  fieldGroupLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.lg,
    ...SHADOWS.primaryGlow,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.sm,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: RADIUS.md,
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.primaryGlow,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
