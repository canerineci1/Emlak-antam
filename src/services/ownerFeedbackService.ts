import { Linking, Alert } from 'react-native';

export interface OwnerFeedbackData {
  ownerName: string;
  ownerPhone?: string;
  propertyTitle: string;
  showingDate: string;
  visitorProfile: string;     // Örn: "Finans Sektörü / 4 Kişilik Aile"
  interestLevel: 'COK_OLUMLU' | 'OLUMSUZ' | 'KARARSIZ';
  mainObjection: string;      // Örn: "2 Milyon TL yüksek bulundu"
  visitorOffer?: string;      // Varsa teklif (Örn: "13.500.000 TL")
  brokerAdvice: string;       // Danışman tavsiyesi
  brokerName: string;
  agencyName: string;
}

export function generateOwnerFeedbackText(data: OwnerFeedbackData): string {
  const icon = data.interestLevel === 'COK_OLUMLU' ? '✅ ÇOK OLUMLU' : data.interestLevel === 'OLUMSUZ' ? '❌ OLUMSUZ' : '🤔 DEĞERLENDİRMEDE';

  return `🏛️ *${data.agencyName.toUpperCase()} - PORTFÖY GÖSTERİM BÜLTENİ*
────────────────────────
Sayın *${data.ownerName}*,

Taşınmazınız için bugün gerçekleştirilen yerinde gösterim ve alıcı geri bildirim raporu aşağıda bilgilerinize sunulmuştur:

📍 *Portföy:* ${data.propertyTitle}
📅 *Gösterim Tarihi:* ${data.showingDate}
👤 *Ziyaretçi Profili:* ${data.visitorProfile}

📊 *ALICI İNTİBASI & GERİ BİLDİRİMİ:*
• *Genel Durum:* ${icon}
• *Alıcı İtirazı / Görüşü:* ${data.mainObjection}
${data.visitorOffer ? `• *İletilen Teklif:* ${data.visitorOffer} TL\n` : ''}
🎯 *DANIŞMAN PAZAR TAVSİYESİ:*
${data.brokerAdvice}

Portföyünüzün en doğru fiyata ve güvenle el değiştirmesi için alıcı takibimiz aralıksız sürmektedir.

Saygılarımla,
*${data.brokerName}*
${data.agencyName}
EmlakÇantam Lisanslı Danışman`;
}

export function sendOwnerFeedbackWhatsApp(data: OwnerFeedbackData) {
  const message = generateOwnerFeedbackText(data);
  const phone = data.ownerPhone ? data.ownerPhone.replace(/[^0-9]/g, '') : '';
  const url = phone 
    ? `whatsapp://send?phone=${phone.startsWith('0') ? '9' + phone : phone.startsWith('90') ? phone : '90' + phone}&text=${encodeURIComponent(message)}`
    : `whatsapp://send?text=${encodeURIComponent(message)}`;

  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp Açılamadı', 'Cihazınızda WhatsApp uygulaması bulunamadı.');
    }
  });
}
