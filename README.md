# 📱 EmlakÇantam – Profesyonel Dijital Emlak Asistanı & Portföy Yönetimi

**EmlakÇantam**, emlak broker ve danışmanlarının sahada kağıt-kalem taşımadan saniyeler içinde **Taşınmaz Gösterme Belgesi** ve **Yetki Sözleşmesi** düzenlemesini, müşteriden dokunmatik imza almasını, **GPS & zaman damgalı** yasal PDF oluşturmasını, müşteri ilişkilerini (CRM) ve ilan portföyünü Firebase bulut senkronizasyonu ile tek merkezden yönetmesini sağlayan yeni nesil mobil platformdur.

---

## 🚀 Öne Çıkan Özellikler

1. **Taşınmaz Gösterme & Dijital İmza:** Dokunmatik imza canvas'ı ile müşteriden anında yasal imza alma.
2. **GPS ve Hukuki Zaman Damgası (`expo-location`):** İmzanın atıldığı konum ve zaman koordinatları belgeye otomatik eklenerek hukuki delil niteliği kazandırır.
3. **Mevzuata Uygun PDF Üretimi (`expo-print`):** *Taşınmaz Ticareti Hakkında Yönetmelik* standartlarında kurumsal logolu ve kaşeli sözleşme PDF'i oluşturma.
4. **Tek Tıkla WhatsApp & Çoklu Paylaşım (`expo-sharing`):** Üretilen belgeleri anında WhatsApp veya e-posta ile müşteriye iletme.
5. **Firebase Cloud Entegrasyonu:**
   - Firebase Firestore ile gerçek zamanlı çift yönlü bulut veri senkronizasyonu.
   - Firebase Auth ile güvenli oturum açma (E-posta/Şifre ve Google Sign-In).
   - Çevrimdışı (Offline-first) çalışma desteği (`AsyncStorage`).
6. **Müşteri & Talep Yönetimi (CRM):** Müşteri kartları, alıcı/kiracı talepleri, bütçe ve aşama takibi, arama/WhatsApp hızlı iletişim kısayolları.
7. **Yapay Zeka Destekli Akıllı Eşleştirme (AI Match):** Müşteri talepleri ile portföydeki ilanları konum, fiyat ve oda sayısına göre akıllı skorlayan ve anında bildiren eşleştirme motoru.
8. **Ekip ve Ofis Yönetimi:** Danışman performans takibi, işlem hacmi istatistikleri ve komisyon özetleri.
9. **Raporlama ve Dışa Aktarma:** PDF ve CSV formatında sözleşme ve portföy raporları.

---

## 🛠️ Kurulum ve Çalıştırma (Expo Go)

### 1. Bağımlılıkları Yükleyin:
```bash
npm install
```

### 2. Expo Geliştirme Sunucusunu Başlatın:
```bash
npx expo start
```

### 3. Telefonunuzda Test Edin:
* **Android:** Google Play'den **Expo Go** uygulamasını indirin ve terminalde beliren QR kodu okutun.
* **iOS:** App Store'dan **Expo Go** uygulamasını indirin ve iPhone kamerası ile QR kodu okutun.

---

## 🔐 Firebase Ayarları
Firebase Console üzerinden aldığınız proje yapılandırma anahtarlarını `src/config/firebase.ts` dosyasına tanımlayarak bulut senkronizasyonunu anında aktif hale getirebilirsiniz.

