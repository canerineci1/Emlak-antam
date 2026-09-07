export function generateRealEstateSummary(rawText: string): string {
  const text = rawText.replace(/["'“”«»]/g, '').trim();
  if (!text) return '';

  const lower = text.toLowerCase();

  // 1. Müşteri Bilgisi Çıkarımı
  let clientName = 'Görüşülen Müşteri';
  let clientRole = 'Alıcı Adayı';

  const nameHonorificMatch = text.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)?)\s+(Bey|Hanım|bey|hanım)/i);
  const nameDirectMatch = text.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+(ile|adlı|isimli|beyle|hanımla)/i);

  if (nameHonorificMatch) {
    clientName = `${nameHonorificMatch[1]} ${nameHonorificMatch[2].charAt(0).toUpperCase() + nameHonorificMatch[2].slice(1).toLowerCase()}`;
  } else if (nameDirectMatch) {
    clientName = `${nameDirectMatch[1]} Bey/Hanım`;
  }

  if (lower.includes('kiralık') || lower.includes('kiracı') || lower.includes('tutmak')) {
    clientRole = 'Kiracı Adayı';
  } else if (lower.includes('yatırım') || lower.includes('yatırımcı')) {
    clientRole = 'Yatırımcı';
  }

  // 2. Taşınmaz & Lokasyon Çıkarımı
  const propertyTypes = ['daire', 'villa', 'rezidans', 'arsa', 'dükkan', 'ofis', 'müstakil', 'yalı', 'ev'];
  const locations = ['moda', 'kadıköy', 'ataşehir', 'beşiktaş', 'şişli', 'çekmeköy', 'bodrum', 'çeşme', 'ömerli', 'üsküdar', 'kartal', 'maltepe', 'pendik', 'başakşehir', 'sarıyer', 'levent'];
  const roomTypes = ['1+1', '2+1', '3+1', '4+1', '4+2', '5+1'];

  let propertyDesc = 'Daire / Konut';
  const foundType = propertyTypes.find(t => lower.includes(t));
  const foundLoc = locations.find(l => lower.includes(l));
  const foundRoom = roomTypes.find(r => lower.includes(r));

  if (foundType || foundLoc || foundRoom) {
    const parts = [
      foundLoc ? foundLoc.charAt(0).toUpperCase() + foundLoc.slice(1) : '',
      foundRoom ? foundRoom : '',
      foundType ? foundType.charAt(0).toUpperCase() + foundType.slice(1) : 'Taşınmaz'
    ].filter(Boolean);
    propertyDesc = parts.join(' ');
  }

  // 3. Değerlendirme & Müşteri Tepkisi (Sentiment)
  let impressionBadge = '🤔 Kararsız / Değerlendirmede';
  let clientFeedback = text;
  let mainObjection = 'Belirtilmedi';

  const isNegative = lower.includes('beğenmedi') || lower.includes('istemiyor') || lower.includes('vazgeçti') || lower.includes('olumsuz') || lower.includes('görüşme yok') || lower.includes('kötü');
  const isPositive = lower.includes('bayıldı') || lower.includes('çok beğendi') || lower.includes('beğendi') || lower.includes('almak istiyor') || lower.includes('tuttu') || lower.includes('olumlu');

  if (isNegative) {
    impressionBadge = '❌ Olumsuz (Mülkü Beğenmedi / İstemiyor)';
  } else if (isPositive) {
    impressionBadge = '✅ Çok Olumlu (Satın Alma / Kiralama Niyetinde)';
  }

  // Fiyat ve Bütçe İtirazı Tespiti
  const priceMatch = text.match(/(\d+([.,]\d+)?)\s*(milyon|bin|tl|TL|lira|euro|dolar|\$|€)?(\s*(fazla|pahalı|eksi|altında|yüksek))?/i);
  let financialNote = 'Fiyat itirazı bulunmuyor.';

  if (priceMatch && priceMatch[1]) {
    const unit = priceMatch[3] ? priceMatch[3].toUpperCase() : 'TL';
    const modifier = priceMatch[5] ? ` (${priceMatch[5].toLowerCase()})` : '';
    financialNote = `${priceMatch[1]} ${unit}${modifier}`;
    mainObjection = `Fiyat piyasa/bütçe beklentisine göre ${priceMatch[1]} ${unit} yüksek bulundu.`;
  } else if (lower.includes('pahalı') || lower.includes('fazla')) {
    mainObjection = 'Liste fiyatı müşterinin bütçesini aşıyor / yüksek bulundu.';
    financialNote = 'Pazarlık beklentisi yüksek.';
  }

  if (lower.includes('küçük') || lower.includes('metrekare') || lower.includes('dar')) {
    mainObjection += (mainObjection !== 'Belirtilmedi' ? ' Ayrıca ' : '') + 'Metrekare ve oda alanları yetersiz bulundu.';
  }
  if (lower.includes('uzak') || lower.includes('konum') || lower.includes('ulaşım')) {
    mainObjection += (mainObjection !== 'Belirtilmedi' ? ' Ayrıca ' : '') + 'Ulaşım ve lokasyon kriterleri uyuşmadı.';
  }

  if (isPositive && mainObjection === 'Belirtilmedi') {
    mainObjection = 'Belirgin bir itiraz yok, mülkün özellikleri beklentileri karşıladı.';
  }

  // 4. Sonuç & Takip Eylem Planı
  let statusSummary = 'Müşteri takibe alındı.';
  let brokerAction = 'Müşteri ile iletişim sürdürülecek.';
  let recommendation = 'Müşterinin talepleri doğrultusunda portföy eşleştirmesi güncellenecek.';

  if (lower.includes('bir daha görüşme yok') || lower.includes('görüşme yok') || lower.includes('istemiyor') || lower.includes('kapandı')) {
    statusSummary = '🛑 Süreç Sonlandırıldı (Bu portföy için dosya kapatıldı)';
    brokerAction = 'Müşteriye bu mülk için tekrar arama yapılmayacak, CRM arşive alındı.';
    recommendation = 'Mülk sahibine fiyatın yüksek bulunduğuna dair geri bildirim paylaşılmalı; portföy Alıcı Radarı üzerinden yeni alıcılara sunulmalı.';
  } else if (lower.includes('cuma') || lower.includes('yarın') || lower.includes('haftaya') || lower.includes('pazartesi') || lower.includes('salı') || lower.includes('çarşamba')) {
    const days = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar', 'yarın', 'haftaya'];
    const foundDay = days.find(d => lower.includes(d));
    const dayStr = foundDay ? foundDay.charAt(0).toUpperCase() + foundDay.slice(1) : 'Belirlenen gün';
    statusSummary = `📅 Takip Randevusu Belirlendi (${dayStr})`;
    brokerAction = `${dayStr} günü müşteri aranarak teklif ve karar durumu teyit edilecek.`;
    recommendation = 'Görüşme öncesi mülk sahibiyle son pazarlık marjı netleştirilmeli.';
  } else if (isPositive) {
    statusSummary = '⚡ Sıcak Alıcı Takibi (Teklif Aşaması)';
    brokerAction = 'Kapora protokolü ve yazılı teklif formu hazırlanarak mülk sahibine iletilecek.';
    recommendation = 'Hızlıca yer gösterme ve kapora protokolü imzalatılarak satış garantiye alınmalı.';
  }

  // Okunaklı, Kurumsal ve Genişletilmiş Çıktı
  return `📋 GAYRİMENKUL SAHA VE GÖRÜŞME RAPORU
────────────────────────────────────────
👤 MÜŞTERİ PROFİLİ:
• İsim / Hitap: ${clientName}
• Müşteri Segmenti: ${clientRole}

🏠 İNCELENEN TAŞINMAZ:
• Mülk Türü / Lokasyon: ${propertyDesc}
• Sunum Kapsamı: Yerinde İnceleme ve Değerlendirme

📊 MÜŞTERİ TEPKİSİ VE İZLENİM:
• Genel Durum: ${impressionBadge}
• Temel Gerekçe / İtiraz: ${mainObjection}
• Ham Müşteri Beyanı: "${clientFeedback}"

💰 FİNANSAL DEĞERLENDİRME:
• Bütçe / Fiyat Durumu: ${financialNote}
• Finansman Yöntemi: ${lower.includes('kredi') ? 'Banka Konut Kredisi' : 'Nakit / Özkaynak'}

🎯 EYLEM PLANI VE AKSİYON:
• Süreç Durumu: ${statusSummary}
• Danışman Aksiyonu: ${brokerAction}
• Danışman Tavsiyesi: ${recommendation}`.trim();
}
