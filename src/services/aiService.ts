import { Property } from '../types';

export interface AiCopyResult {
  portalTitle: string;
  portalDescription: string;
  reelsScript: string;
  reelsHashtags: string;
  whatsappBroadcast: string;
}

export function generateAiMarketingContent(property: Property, extraHighlights: string[] = []): AiCopyResult {
  const isSatilik = property.type === 'SATILIK';
  const actionText = isSatilik ? 'Satılık' : 'Kiralık';
  const categoryText = property.propertyCategory === 'VILLA' ? 'Lüks Villa' : 'Daire';
  const locText = `${property.district} ${property.neighborhood || ''}`;
  const highlights = extraHighlights.length > 0 ? extraHighlights.join(', ') : 'Merkezi lokasyon, ferah cephe, yüksek prim potansiyeli';

  // 1. Sahibinden / Hepsiemlak Başlık & Açıklama
  const portalTitle = `✨ ${property.district.toUpperCase()}'DE FIRSAT! ${property.rooms || '3+1'} ${actionText.toUpperCase()} ${categoryText.toUpperCase()} ✨`;

  const portalDescription = `
📍 **LOKASYON & ÇEVRESEL AVANTAJLAR**
İstanbul / ${property.city} - ${property.district} ${property.neighborhood} mevkiinde, ulaşım hatlarına ve yaşam merkezlerine yürüme mesafesinde.

🏡 **MÜLKÜN ÖNE ÇIKAN NİTELİKLERİ**
• **İşlem Türü:** ${actionText} ${categoryText}
• **Oda Sayısı:** ${property.rooms || 'Geniş ve Ferah Plan'}
• **Fiyat:** ${property.price} TL
• **Özellikler:** ${highlights}
• **Hukuki Durum:** Kat Mülkiyetli / Krediye Uygun / İskanlı

🎯 **YATIRIM & YAŞAM DEĞERİ**
Bölgenin en hızlı değer kazanan lokasyonunda, hem oturum hem de yüksek kira getirisi için eşsiz bir fırsat sunmaktadır.

📞 *Detaylı bilgi, randevu ve yerinde inceleme için lütfen iletişime geçiniz.*
Yetkili Gayrimenkul Danışmanlığı
  `.trim();

  // 2. Instagram Reels / TikTok Senaryosu
  const reelsScript = `
🎬 **REELS VİDEO SENARYOSU (15-30 Saniye)**

[00:00 - 00:03] 💥 **Kanca (Hook):**
(Kamera geniş salondan başlar) 
"Eğer ${property.district}'de ev bakıyorsanız, bu videoyu kaydetmeden geçmeyin!"

[00:04 - 00:12] 🚪 **Ev Turu & Detaylar:**
(Hızlı geçişlerle mutfak, banyo ve manzarayı gösterin)
"Burası ${property.price} TL fiyatıyla bölgedeki en cazip ${property.rooms || '3+1'} ${actionText.toLowerCase()} mülk. ${highlights}."

[00:13 - 00:20] 📲 **Eylem Çağrısı (CTA):**
(Danışman kameraya döner)
"Evi yerinde görmek ve ilk teklifi veren olmak için profildeki linkten bana ulaşın veya 'BİLGİ' yazın, detayları hemen DM'den atayım!"
  `.trim();

  const reelsHashtags = `#emlak #${property.district.toLowerCase()}emlak #${isSatilik ? 'satilikdaire' : 'kiralikdaire'} #gayrimenkul #istanbulgayrimenkul #lükskonut #yatırımfırsatı #evturuvideosu`;

  // 3. WhatsApp Toplu Portföy Bülteni
  const whatsappBroadcast = `
🔥 *YENİ PORTFÖY FIRSATI!* 🔥

📍 *Bölge:* ${property.district} / ${property.city}
🏠 *Mülk:* ${property.rooms || '3+1'} ${actionText} ${categoryText}
💰 *Fiyat:* ${property.price} TL
✨ *Özellikler:* ${highlights}

📞 Bu özel portföyü ilk görenlerden olmak ve detaylı sunum almak için mesaj atabilirsiniz!
  `.trim();

  return {
    portalTitle,
    portalDescription,
    reelsScript,
    reelsHashtags,
    whatsappBroadcast,
  };
}
