export interface RentIncreaseInput {
  currentRent: number;
  tufeRate: number; // Örn: 59.80 (%)
  contractDate?: string;
  tenantName?: string;
  landlordName?: string;
  propertyTitle?: string;
}

export interface RentIncreaseResult {
  currentRent: number;
  tufeRate: number;
  increaseAmount: number;
  newRent: number;
  legalBasis: string;
}

export function calculateRentIncrease(input: RentIncreaseInput): RentIncreaseResult {
  const { currentRent, tufeRate } = input;
  const increaseAmount = Math.round(currentRent * (tufeRate / 100));
  const newRent = currentRent + increaseAmount;

  return {
    currentRent,
    tufeRate,
    increaseAmount,
    newRent,
    legalBasis: '6098 Sayılı Türk Borçlar Kanunu Madde 344 (TÜİK 12 Aylık TÜFE Ortalaması Yasal Tavan Artış Haddi)'
  };
}

export function buildRentIncreaseWhatsAppText(input: RentIncreaseInput, res: RentIncreaseResult, target: 'TENANT' | 'LANDLORD'): string {
  const isTenant = target === 'TENANT';
  const personName = isTenant ? (input.tenantName || 'Kiracımız') : (input.landlordName || 'Mülk Sahibimiz');

  return `
📈 *YASAL KİRA ARTIŞ HESAPLAMA VE BİLDİRİM FORMU*
Sayın ${personName}, Merhaba.
${input.propertyTitle ? `🏠 *Taşınmaz:* ${input.propertyTitle}\n` : ''}
6098 sayılı Türk Borçlar Kanunu Madde 344 gereğince, Türkiye İstatistik Kurumu (TÜİK) tarafından açıklanan 12 aylık TÜFE ortalaması doğrultusunda yasal kira yenileme hesap dökümü aşağıdadır:

📊 *HESAP DETAYLARI:*
• Mevcut Kira Bedeli: ${res.currentRent.toLocaleString('tr-TR')} TL
• TÜİK Yasal TÜFE Artış Oranı: *%${res.tufeRate}*
• Net Kira Artış Tutarı: ${res.increaseAmount.toLocaleString('tr-TR')} TL
• *Yeni Dönem Yasal Kira Bedeli:* *${res.newRent.toLocaleString('tr-TR')} TL*

📌 *Yasal Dayanak:* 6098 sayılı TBK m. 344 uyarınca konut ve çatılı işyeri kiralarında yasal tavan artış oranıdır.

Hayırlı ve bereketli bir dönem dileriz.
*Meta Gayrimenkul Danışmanlığı*
  `.trim();
}
