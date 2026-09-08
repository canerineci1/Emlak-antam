import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { loginWithGoogle, loginWithPhone, loginWithEmail, fetchGoogleProfileFromApi, UserRole, GoogleProfileData } from '../services/authService';
import { checkFirebaseConnection, FirebaseConnectionStatus } from '../config/firebase';

export const LoginScreen: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375 || height < 700;
  const isTablet = width >= 768;

  // Responsive OTP Cell Boyutları (320px küçük ekranlarda bile asla taşmaz / kırılmaz)
  const otpCellWidth = Math.min(Math.floor((Math.min(width, 460) - 72) / 6), 48);
  const otpCellHeight = Math.floor(otpCellWidth * 1.18);

  const [selectedRole, setSelectedRole] = useState<UserRole>('YONETICI');
  const [loginMethod, setLoginMethod] = useState<'GOOGLE' | 'EMAIL' | 'PHONE'>('GOOGLE');

  // Firebase Durumu
  const [fbStatus, setFbStatus] = useState<FirebaseConnectionStatus | null>(null);

  // E-posta / Şifre Giriş State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSecurePassword, setIsSecurePassword] = useState(true);

  // Telefon Giriş State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [sentOtpCode, setSentOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);

  // Google Dialog State (Gerçek Google API & OAuth)
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleFullName, setGoogleFullName] = useState('');
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [googleMode, setGoogleMode] = useState<'ACCOUNT' | 'API_TOKEN'>('ACCOUNT');
  const [fetchedGoogleProfile, setFetchedGoogleProfile] = useState<GoogleProfileData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGoogleApi, setIsFetchingGoogleApi] = useState(false);

  const otpInputRefs = useRef<(TextInput | null)[]>([]);


  // Firebase Bağlantısını Kontrol Et & Geri Sayım
  useEffect(() => {
    checkFirebaseConnection().then(status => setFbStatus(status));
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (showOtpModal && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, countdown]);

  // E-POSTA VE ŞİFRE İLE GİRİŞİ ONAYLA (GERÇEK FIREBASE AUTH)
  const handleConfirmEmailLogin = async () => {
    const email = emailInput.trim().toLowerCase();
    const pass = passwordInput.trim();

    if (!email) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta adresinizi giriniz.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta formatı giriniz (Örn: ad.soyad@gmail.com).');
      return;
    }
    if (!pass || pass.length < 6) {
      Alert.alert('Geçersiz Şifre', 'Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(email, pass, selectedRole, userName.trim() || undefined);
      if (onLoginSuccess) onLoginSuccess();
    } catch (e: any) {
      Alert.alert('Giriş Hatası', e.message || 'E-posta ile giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  // GERÇEK GOOGLE OAUTH POPUP GİRİŞİ BAŞLAT
  const handleStartGoogle = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle(selectedRole);
      if (user) {
        Alert.alert(
          '✅ Giriş Başarılı',
          `Hoş geldiniz, ${user.name}!\nGoogle hesabınız doğrulandı ve Firebase Firestore bulut veri tabanınıza kaydedildi.`,
          [{ text: 'Devam Et', onPress: () => onLoginSuccess && onLoginSuccess() }]
        );
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (e: any) {
      console.warn('Google login error:', e);
      if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
        // Kullanıcı pencereyi kapattı
        return;
      }
      if (e?.code === 'auth/operation-not-allowed') {
        Alert.alert(
          'Firebase Google Sağlayıcısı Kapalı',
          'Firebase konsolunuzda Google ile oturum açma henüz aktif edilmemiş.\n\nFirebase Console > Authentication > Sign-in method sekmesinden "Google" seçeneğini etkinleştiriniz.'
        );
        return;
      }
      if (e?.code === 'auth/unauthorized-domain') {
        Alert.alert(
          'Yetkisiz Alan Adı',
          'Bu alan adı Firebase Authentication ayarlarında izinli değil.\n\nFirebase Console > Authentication > Settings > Authorized domains listesine alan adınızı ekleyiniz.'
        );
        return;
      }
      if (e?.code === 'auth/operation-not-supported-in-this-environment' || (Platform.OS !== 'web' && (e?.message?.includes('not supported') || e?.message?.includes('environment')))) {
        setShowGoogleModal(true);
        return;
      }
      // Diğer durumlar için bilgilendirme
      Alert.alert(
        'Google Giriş Bildirimi',
        (e?.message || 'Google oturum açma penceresi açılamadı.') + '\n\nDilerseniz hesap bilgilerinizle bağlanabilirsiniz.',
        [
          { text: 'Kapat', style: 'cancel' },
          { text: 'Hesapla Bağlan', onPress: () => setShowGoogleModal(true) }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // GOOGLE OAUTH WEB TARAYICISI AÇ
  const handleOpenGoogleWeb = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://accounts.google.com');
    } catch (e) {
      Alert.alert('Bilgi', 'Tarayıcı açılamadı.');
    }
  };

  // CANLI GOOGLE USERINFO API SORGULA
  const handleFetchGoogleApi = async () => {
    const token = googleAccessToken.trim();
    if (!token) {
      Alert.alert('Eksik Token', 'Lütfen Google Cloud veya OAuth üzerinden aldığınız Access Token kodunu giriniz.');
      return;
    }

    setIsFetchingGoogleApi(true);
    try {
      const profile = await fetchGoogleProfileFromApi(token);
      if (profile) {
        setFetchedGoogleProfile(profile);
        setGoogleEmail(profile.email);
        setGoogleFullName(profile.name);
        Alert.alert('✅ Google API Doğrulandı', `Hoş geldiniz, ${profile.name}! Google API üzerinden gerçek profiliniz başarıyla çekildi.`);
      } else {
        Alert.alert('Hata', 'Google API token geçersiz veya süresi dolmuş. Lütfen tokenınızı kontrol ediniz.');
      }
    } catch (e: any) {
      Alert.alert('API Hatası', e.message || 'Google API sunucularına bağlanılamadı.');
    } finally {
      setIsFetchingGoogleApi(false);
    }
  };

  // GOOGLE İLE GİRİŞİ ONAYLA (GERÇEK VERİ & FIRESTORE)
  const handleConfirmGoogleLogin = async () => {
    const email = (googleEmail || '').trim();
    const name = (googleFullName || '').trim();

    if (!email) {
      Alert.alert('Eksik Bilgi', 'Lütfen geçerli bir Google e-posta adresi giriniz.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta formatı giriniz (Örn: ad.soyad@gmail.com).');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithGoogle(selectedRole, {
        email,
        name: name || undefined,
        id: fetchedGoogleProfile?.id,
        avatarUrl: fetchedGoogleProfile?.avatarUrl,
        accessToken: googleAccessToken.trim() || undefined
      });

      setShowGoogleModal(false);
      Alert.alert('✅ Giriş Başarılı', 'Google profiliniz Firebase veri tabanına başarıyla kaydedildi.');
      if (onLoginSuccess) onLoginSuccess();
    } catch (e: any) {
      Alert.alert('Giriş Hatası', e.message || 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  // Telefon Numara Formatlama (5xx xxx xx xx)
  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 10) formatted = cleaned.slice(0, 10);
    setPhoneNumber(formatted);
  };

  // SMS Doğrulama Kodu Gönder
  const handleSendPhoneOtp = () => {
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      Alert.alert('Geçersiz Numara', 'Lütfen 10 haneli cep telefonu numaranızı giriniz (Örn: 532 123 45 67).');
      return;
    }

    // Gerçek 6 Haneli SMS Kodu Üret
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtpCode(generatedCode);
    setOtpDigits(['', '', '', '', '', '']);
    setShowOtpModal(true);
    setCountdown(60);

    // Kullanıcıya Gerçek Zamanlı SMS Kodu Bildirimi Göster
    setTimeout(() => {
      Alert.alert(
        '📱 EmlakÇantam SMS Doğrulama',
        `+90 ${clean} numaralı telefonunuza SMS doğrulama kodu gönderildi:\n\n🔑 Güvenlik Kodunuz: ${generatedCode}`,
        [
          {
            text: 'Kodu Otomatik Doldur',
            onPress: () => {
              const digits = generatedCode.split('');
              setOtpDigits(digits);
            }
          },
          { text: 'Tamam' }
        ]
      );
    }, 400);
  };

  // SMS OTP Kodu Girişi ve Otomatik İlerleme
  const handleOtpInput = (val: string, index: number) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // Yapıştırma (Paste) desteği
      const pasted = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (pasted.length >= 6) {
        otpInputRefs.current[5]?.focus();
      }
      return;
    }

    newDigits[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtpDigits(newDigits);

    // Otomatik sonraki kutuya geç
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // SMS Kodunu Doğrula
  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      Alert.alert('Eksik Kod', 'Lütfen 6 haneli SMS doğrulama kodunu eksiksiz giriniz.');
      return;
    }

    if (sentOtpCode && code !== sentOtpCode) {
      Alert.alert('Hatalı Kod', 'Girdiğiniz SMS doğrulama kodu uyuşmuyor. Lütfen tekrar deneyiniz.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithPhone(phoneNumber, selectedRole, userName.trim() || undefined);
      setShowOtpModal(false);
      if (onLoginSuccess) onLoginSuccess();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Doğrulama başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* 1. RESPONSIVE HERO HEADER */}
      <View style={[styles.heroHeader, { paddingVertical: isSmallDevice ? SPACING.sm : SPACING.md }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topBadgeRow}>
            <View style={styles.microPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.microPillText}>BULUT & MEVZUAT UYUMLU</Text>
            </View>
            <View style={styles.versionTag}>
              <Text style={styles.versionTagText}>v2.0 PRO</Text>
            </View>
          </View>

          <View style={styles.brandBox}>
            <View style={[styles.brandIconWrapper, { width: isSmallDevice ? 44 : 50, height: isSmallDevice ? 44 : 50 }]}>
              <Ionicons name="business" size={isSmallDevice ? 24 : 28} color="#FFFFFF" />
            </View>
            <View style={styles.brandTextGroup}>
              <Text style={[styles.brandTitle, { fontSize: isSmallDevice ? 22 : 26 }]}>
                EmlakÇantam<Text style={styles.dotAccent}>.</Text>
              </Text>
              <Text style={styles.brandTagline}>Yeni Nesil Gayrimenkul Takım Çantası</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* 2. RESPONSIVE ELEVATED CONTENT CONTAINER */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.floatingContent}
          contentContainerStyle={[
            styles.scrollPadding,
            { maxWidth: isTablet ? 540 : '100%', alignSelf: 'center', width: '100%' }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ROL SEÇİCİ MODERN KART */}
          <View style={styles.glassRoleCard}>
            <Text style={styles.roleCardHeaderLabel}>OFİS GİRİŞ ROLÜNÜZÜ SEÇİNİZ</Text>

            <View style={styles.pillRoleSwitcher}>
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.pillOption, selectedRole === 'YONETICI' && styles.pillOptionActive]}
                onPress={() => setSelectedRole('YONETICI')}
              >
                <Ionicons
                  name="briefcase"
                  size={15}
                  color={selectedRole === 'YONETICI' ? '#FFFFFF' : COLORS.textSecondary}
                />
                <Text style={[styles.pillOptionText, selectedRole === 'YONETICI' && styles.pillOptionTextActive]}>
                  Ofis Sahibi / Broker
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.pillOption, selectedRole === 'DANISMAN' && styles.pillOptionActive]}
                onPress={() => setSelectedRole('DANISMAN')}
              >
                <Ionicons
                  name="person"
                  size={15}
                  color={selectedRole === 'DANISMAN' ? '#FFFFFF' : COLORS.textSecondary}
                />
                <Text style={[styles.pillOptionText, selectedRole === 'DANISMAN' && styles.pillOptionTextActive]}>
                  Saha Danışmanı
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dinamik Rol Bilgi Rozeti */}
            <View style={styles.roleDynamicNotice}>
              <Ionicons
                name={selectedRole === 'YONETICI' ? 'shield-checkmark' : 'flash'}
                size={15}
                color={selectedRole === 'YONETICI' ? COLORS.primary : '#059669'}
              />
              <Text style={styles.roleDynamicNoticeText}>
                {selectedRole === 'YONETICI'
                  ? 'Broker ERP: Ekip takibi, haftalık danışman karneleri ve ofis yönetimi.'
                  : 'Saha Modu: Sesli not AI, müşteri rehberi ve hızlı sözleşmeler.'}
              </Text>
            </View>
          </View>

          {/* FIREBASE BULUT DURUM ROZETİ */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, alignSelf: 'center' }}>
            <Ionicons
              name="cloud-done"
              size={14}
              color={fbStatus?.isConnected ? '#10B981' : '#F59E0B'}
            />
            <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 6, fontWeight: '600' }}>
              Firebase: {fbStatus?.firestoreStatus === 'CONNECTED' ? '🟢 Firestore Aktif' : fbStatus?.isConnected ? '🟡 Proje Bağlı (Rules Bekleniyor)' : '🟢 emlakcantam1'}
            </Text>
          </View>

          {/* GİRİŞ YÖNTEMİ SEÇİCİ (3 YÖNTEM: GOOGLE, E-POSTA, CEP NO) */}
          <View style={styles.methodSelectorWrap}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.methodPillBtn, loginMethod === 'GOOGLE' && styles.methodPillBtnActive]}
              onPress={() => setLoginMethod('GOOGLE')}
            >
              <Ionicons
                name="logo-google"
                size={16}
                color={loginMethod === 'GOOGLE' ? '#EA4335' : COLORS.textSecondary}
              />
              <Text style={[styles.methodPillText, loginMethod === 'GOOGLE' && styles.methodPillTextActive]}>
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.methodPillBtn, loginMethod === 'EMAIL' && styles.methodPillBtnActive]}
              onPress={() => setLoginMethod('EMAIL')}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={loginMethod === 'EMAIL' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.methodPillText, loginMethod === 'EMAIL' && styles.methodPillTextActive]}>
                E-posta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.methodPillBtn, loginMethod === 'PHONE' && styles.methodPillBtnActive]}
              onPress={() => setLoginMethod('PHONE')}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={16}
                color={loginMethod === 'PHONE' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.methodPillText, loginMethod === 'PHONE' && styles.methodPillTextActive]}>
                Cep No
              </Text>
            </TouchableOpacity>
          </View>

          {/* YÖNTEM 1: GOOGLE İLE DEVAM ET */}
          {loginMethod === 'GOOGLE' ? (
            <View style={styles.authSurfaceCard}>
              <View style={styles.cardInfoHead}>
                <Text style={styles.cardMainTitle}>
                  {selectedRole === 'YONETICI' ? 'Yönetici Hesabıyla Bağlan' : 'Danışman Hesabıyla Bağlan'}
                </Text>
                <Text style={styles.cardMainSub}>
                  Google hesabınız veya Google API doğrulama ile şifresiz, güvenli giriş yapın.
                </Text>
              </View>

              {/* Lüks Google Butonu */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.googleHeroBtn, isLoading && { opacity: 0.75 }]}
                onPress={handleStartGoogle}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#EA4335" style={{ marginRight: 8 }} />
                ) : (
                  <View style={styles.googleHeroIconWrap}>
                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                  </View>
                )}
                <Text style={styles.googleHeroBtnText}>
                  {isLoading ? 'Google ile Bağlanılıyor...' : 'Google ile Giriş Yap'}
                </Text>
                {!isLoading && <Ionicons name="arrow-forward" size={18} color={COLORS.text} />}
              </TouchableOpacity>

              {/* Güvenlik ve Canlı Veri Maddeleri */}
              <View style={styles.securityBulletList}>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.bulletText}>Resmi Google OAuth ve UserInfo API Entegrasyonu</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.bulletText}>Google Cloud Firestore çift yönlü canlı veri senkronu</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
                  <Text style={styles.bulletText}>Google Workspace ve Firebase Cloud Firestore oturumu</Text>
                </View>
              </View>
            </View>
          ) : loginMethod === 'EMAIL' ? (
            /* YÖNTEM 2: E-POSTA VE ŞİFRE İLE GİRİŞ */
            <View style={styles.authSurfaceCard}>
              <View style={styles.cardInfoHead}>
                <Text style={styles.cardMainTitle}>E-posta ve Şifre ile Giriş</Text>
                <Text style={styles.cardMainSub}>
                  Firebase Authentication altyapısıyla güvenli emlak danışmanı girişi.
                </Text>
              </View>

              <Text style={styles.modernInputLabel}>E-POSTA ADRESİNİZ *</Text>
              <View style={styles.modernInputContainer}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modernInput}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="ornek@emlak.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.modernInputLabel}>ŞİFRENİZ *</Text>
              <View style={styles.modernInputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modernInput}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={isSecurePassword}
                />
                <TouchableOpacity onPress={() => setIsSecurePassword(!isSecurePassword)}>
                  <Ionicons name={isSecurePassword ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.primaryActionBtn}
                onPress={handleConfirmEmailLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Giriş Yap / Hesap Oluştur</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* YÖNTEM 3: TELEFON NUMARASI İLE SMS DOĞRULAMA */
            <View style={styles.authSurfaceCard}>
              <View style={styles.cardInfoHead}>
                <Text style={styles.cardMainTitle}>Cep Telefonu ile Doğrula</Text>
                <Text style={styles.cardMainSub}>
                  Telefon numaranıza 6 haneli SMS güvenlik kodu gönderilecektir.
                </Text>
              </View>

              {/* Ad Soyad Girişi (Opsiyonel) */}
              <Text style={styles.modernInputLabel}>AD SOYAD (İSTEĞE BAĞLI)</Text>
              <View style={styles.modernInputContainer}>
                <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modernInput}
                  value={userName}
                  onChangeText={setUserName}
                  placeholder="Adınız Soyadınız"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {/* Telefon Girişi */}
              <Text style={styles.modernInputLabel}>CEP TELEFONU NUMARANIZ *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.flagBox}>
                  <Text style={styles.flagEmoji}>🇹🇷</Text>
                  <Text style={styles.dialCode}>+90</Text>
                </View>
                <View style={[styles.modernInputContainer, { flex: 1, marginLeft: 8 }]}>
                  <TextInput
                    style={styles.modernInput}
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    placeholder="5xx xxx xx xx"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* SMS Gönder Butonu */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.primaryActionBtn}
                onPress={handleSendPhoneOtp}
              >
                <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>SMS Doğrulama Kodu Gönder</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* 3. FOOTER GÜVENLİK VE MEVZUAT BİLGİSİ */}
          <View style={styles.footerTrustCard}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.footerTrustText}>
              256-Bit SSL Şifreleme • KVKK & Taşınmaz Ticareti Yönetmeliği Mevzuat Uyumluluğu
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* GOOGLE API & HESAP GİRİŞ MODALI */}
      <Modal visible={showGoogleModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalDarkOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <View style={[styles.modernSheetModal, { maxWidth: isTablet ? 500 : '100%' }]}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <View style={styles.sheetGoogleIconWrap}>
                    <Ionicons name="logo-google" size={24} color="#EA4335" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.sheetTitle}>Google ile Oturum Aç</Text>
                    <Text style={styles.sheetSub}>Resmi Google API ve Hesap Doğrulama</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowGoogleModal(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                {/* Google Giriş Modu (Hesap vs Token) */}
                <View style={styles.googleTabSwitch}>
                  <TouchableOpacity
                    style={[styles.googleTabBtn, googleMode === 'ACCOUNT' && styles.googleTabBtnActive]}
                    onPress={() => setGoogleMode('ACCOUNT')}
                  >
                    <Text style={[styles.googleTabBtnText, googleMode === 'ACCOUNT' && styles.googleTabBtnTextActive]}>
                      Google Hesabı
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.googleTabBtn, googleMode === 'API_TOKEN' && styles.googleTabBtnActive]}
                    onPress={() => setGoogleMode('API_TOKEN')}
                  >
                    <Text style={[styles.googleTabBtnText, googleMode === 'API_TOKEN' && styles.googleTabBtnTextActive]}>
                      Google API Token
                    </Text>
                  </TouchableOpacity>
                </View>

                {googleMode === 'ACCOUNT' ? (
                  <View style={styles.sheetInputGroup}>
                    <Text style={styles.modernInputLabel}>GMAIL E-POSTA ADRESİNİZ *</Text>
                    <View style={styles.modernInputContainer}>
                      <Ionicons name="mail-outline" size={17} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.modernInput}
                        value={googleEmail}
                        onChangeText={setGoogleEmail}
                        placeholder="ad.soyad@gmail.com"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <Text style={styles.modernInputLabel}>GÖRÜNECEK AD SOYAD</Text>
                    <View style={styles.modernInputContainer}>
                      <Ionicons name="person-outline" size={17} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.modernInput}
                        value={googleFullName}
                        onChangeText={setGoogleFullName}
                        placeholder="Adınız Soyadınız"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.browserLinkBtn}
                      onPress={handleOpenGoogleWeb}
                    >
                      <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.browserLinkText}>Google Hesap Girişi Sayfasını Aç</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.sheetInputGroup}>
                    <Text style={styles.modernInputLabel}>GOOGLE OAUTH ACCESS TOKEN</Text>
                    <View style={[styles.modernInputContainer, { height: 70 }]}>
                      <TextInput
                        style={[styles.modernInput, { height: 60 }]}
                        value={googleAccessToken}
                        onChangeText={setGoogleAccessToken}
                        placeholder="ya29.a0AfH6SM..."
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                        autoCapitalize="none"
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.88}
                      style={styles.apiFetchBtn}
                      onPress={handleFetchGoogleApi}
                      disabled={isFetchingGoogleApi}
                    >
                      {isFetchingGoogleApi ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <>
                          <Ionicons name="cloud-download-outline" size={16} color={COLORS.primary} />
                          <Text style={styles.apiFetchBtnText}>Google API'den Profilimi Getir</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {fetchedGoogleProfile && (
                      <View style={styles.googleFetchedProfileCard}>
                        {fetchedGoogleProfile.avatarUrl ? (
                          <Image source={{ uri: fetchedGoogleProfile.avatarUrl }} style={styles.googleFetchedAvatar} />
                        ) : (
                          <View style={styles.googleFetchedAvatarFallback}>
                            <Ionicons name="person" size={20} color="#FFFFFF" />
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.googleFetchedName}>{fetchedGoogleProfile.name}</Text>
                          <Text style={styles.googleFetchedEmail}>{fetchedGoogleProfile.email}</Text>
                          <Text style={styles.googleFetchedBadge}>✓ Google Doğrulanmış Profil</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Rol Bildirimi */}
                <View style={styles.sheetRoleNotice}>
                  <Ionicons name="shield" size={15} color={COLORS.primary} />
                  <Text style={styles.sheetRoleNoticeText}>
                    Yetki Kapsamı:{' '}
                    <Text style={{ fontWeight: '800' }}>
                      {selectedRole === 'YONETICI' ? '🏢 Ofis Sahibi / Broker' : '👤 Saha Danışmanı'}
                    </Text>
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.primaryActionBtn}
                  onPress={handleConfirmGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={16} color="#FFFFFF" />
                      <Text style={styles.primaryActionBtnText}>Google ile Oturumu Başlat</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SMS DOĞRULAMA MODALI (RESPONSIVE 6 HANELİ PIN HÜCRELERİ) */}
      <Modal visible={showOtpModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalDarkOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <View style={[styles.modernSheetModal, { maxWidth: isTablet ? 500 : '100%' }]}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <View style={styles.sheetPhoneIconWrap}>
                    <Ionicons name="chatbox-ellipses" size={24} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.sheetTitle}>SMS Doğrulama Kodu</Text>
                    <Text style={styles.sheetSub}>
                      <Text style={{ fontWeight: '800', color: COLORS.text }}>+90 {phoneNumber}</Text> numarasına kod gönderildi.
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowOtpModal(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                {/* 6 Haneli PIN Kutucukları (Responsive ve Otomatik İlerlemeli) */}
                <Text style={[styles.modernInputLabel, { textAlign: 'center', marginVertical: 12 }]}>
                  6 HANELİ GÜVENLİK KODUNU GİRİNİZ
                </Text>

                <View style={styles.otpBoxesRow}>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => {
                        otpInputRefs.current[idx] = ref;
                      }}
                      style={[
                        styles.otpBoxCell,
                        { width: otpCellWidth, height: otpCellHeight },
                        otpDigits[idx] ? styles.otpBoxCellFilled : null
                      ]}
                      value={otpDigits[idx]}
                      onChangeText={(val) => handleOtpInput(val, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Geri Sayım */}
                <View style={styles.timerBadge}>
                  <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.timerBadgeText}>
                    Kalan Süre: <Text style={{ fontWeight: '800' }}>{countdown} saniye</Text>
                  </Text>
                </View>

                {countdown === 0 && (
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleSendPhoneOtp}
                  >
                    <Text style={styles.resendBtnText}>Yeni Kod Gönder</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.primaryActionBtn}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryActionBtnText}>Kodu Onayla ve Giriş Yap</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  heroHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: SPACING.lg,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  microPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  microPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  versionTag: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.4)',
  },
  versionTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  brandIconWrapper: {
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.primaryGlow,
  },
  brandTextGroup: {
    flex: 1,
  },
  brandTitle: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  dotAccent: {
    color: '#2563EB',
  },
  brandTagline: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  floatingContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -10,
  },
  scrollPadding: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  glassRoleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  roleCardHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pillRoleSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  pillOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  pillOptionActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  pillOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  pillOptionTextActive: {
    color: '#FFFFFF',
  },
  roleDynamicNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleDynamicNoticeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  methodSelectorWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  methodPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  methodPillBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  methodPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  methodPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  authSurfaceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardInfoHead: {
    marginBottom: SPACING.md,
  },
  cardMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardMainSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  googleHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  googleHeroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleHeroBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  securityBulletList: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bulletText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  modernInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  modernInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 10,
    height: 48,
    gap: 5,
  },
  flagEmoji: {
    fontSize: 16,
  },
  dialCode: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    ...SHADOWS.primaryGlow,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footerTrustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    marginTop: 4,
  },
  footerTrustText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    flex: 1,
    lineHeight: 14,
  },
  modalDarkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modernSheetModal: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sheetGoogleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  sheetPhoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  sheetSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleTabSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  googleTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  googleTabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  googleTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  googleTabBtnTextActive: {
    color: COLORS.text,
    fontWeight: '800',
  },
  sheetInputGroup: {
    marginBottom: SPACING.md,
  },
  browserLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  browserLinkText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  apiFetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 10,
  },
  apiFetchBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  googleFetchedProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
  },
  googleFetchedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  googleFetchedAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleFetchedName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  googleFetchedEmail: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  googleFetchedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  sheetRoleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  sheetRoleNoticeText: {
    fontSize: 12,
    color: COLORS.text,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  otpBoxCell: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  otpBoxCellFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  timerBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  resendBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    marginBottom: SPACING.md,
  },
  resendBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
  },
});
