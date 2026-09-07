export interface CalculationInput {
  propertyPrice: number;
  loanAmount: number;
  monthlyInterestRate: number; // örn: 2.89 (%)
  termMonths: number; // örn: 120 (ay)
}

export interface CalculationResult {
  propertyPrice: number;
  buyerDeedFee: number; // %2
  sellerDeedFee: number; // %2
  totalDeedFee: number; // %4
  revolvingFund: number; // %6 Döner Sermaye Bedeli
  brokerCommission: number; // %2 + %20 KDV
  totalBuyerExpenses: number; // Alıcı Tapu Harcı + %6 Döner Sermaye + Komisyon
  
  // Kredi Hesapları
  loanAmount: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  
  // Peşinat İhtiyacı
  downPayment: number;
  totalCashNeeded: number; // Peşinat + Masraflar
}

export function calculateRealEstateExpenses(input: CalculationInput): CalculationResult {
  const { propertyPrice, loanAmount, monthlyInterestRate, termMonths } = input;

  const buyerDeedFee = Math.round(propertyPrice * 0.02);
  const sellerDeedFee = Math.round(propertyPrice * 0.02);
  const totalDeedFee = buyerDeedFee + sellerDeedFee;
  
  // Döner Sermaye Bedeli: %6
  const revolvingFund = Math.round(propertyPrice * 0.06);
  
  const brokerCommission = Math.round(propertyPrice * 0.02 * 1.20); // %2 + %20 KDV
  const totalBuyerExpenses = buyerDeedFee + revolvingFund + brokerCommission;

  // Konut Kredisi Formülü: Taksit = K * [ i * (1+i)^n ] / [ (1+i)^n - 1 ]
  let monthlyPayment = 0;
  let totalRepayment = 0;
  let totalInterest = 0;

  if (loanAmount > 0 && monthlyInterestRate > 0 && termMonths > 0) {
    const r = monthlyInterestRate / 100;
    const factor = Math.pow(1 + r, termMonths);
    monthlyPayment = Math.round(loanAmount * (r * factor) / (factor - 1));
    totalRepayment = monthlyPayment * termMonths;
    totalInterest = totalRepayment - loanAmount;
  }

  const downPayment = Math.max(0, propertyPrice - loanAmount);
  const totalCashNeeded = downPayment + totalBuyerExpenses;

  return {
    propertyPrice,
    buyerDeedFee,
    sellerDeedFee,
    totalDeedFee,
    revolvingFund,
    brokerCommission,
    totalBuyerExpenses,
    loanAmount,
    monthlyPayment,
    totalRepayment,
    totalInterest,
    downPayment,
    totalCashNeeded,
  };
}

export function buildExpensePlanWhatsAppText(res: CalculationResult, propertyTitle?: string): string {
  return `
📊 *GAYRİMENKUL ALIM MASRAF VE KREDİ ÖDEME PLANI*
${propertyTitle ? `🏠 *Taşınmaz:* ${propertyTitle}\n` : ''}
💰 *Satış Fiyatı:* ${res.propertyPrice.toLocaleString('tr-TR')} TL

📋 *1. TAPU VE ALIM MASRAFLARI:*
• Alıcı Tapu Harcı (%2): ${res.buyerDeedFee.toLocaleString('tr-TR')} TL
• Döner Sermaye Bedeli (%6): ${res.revolvingFund.toLocaleString('tr-TR')} TL
• Hizmet Komisyonu (%2 + KDV): ${res.brokerCommission.toLocaleString('tr-TR')} TL
📌 *Toplam Alıcı Masrafı:* *${res.totalBuyerExpenses.toLocaleString('tr-TR')} TL*

🏦 *2. KONUT KREDİSİ DETAYLARI:*
• Çekilecek Kredi: ${res.loanAmount.toLocaleString('tr-TR')} TL
• Aylık Taksit: *${res.monthlyPayment.toLocaleString('tr-TR')} TL*
• Toplam Geri Ödeme: ${res.totalRepayment.toLocaleString('tr-TR')} TL

💵 *3. NAKİT GEREKSİNİMİ:*
• Gerekli Peşinat: ${res.downPayment.toLocaleString('tr-TR')} TL
• *Toplam Gerekli Nakit:* *${res.totalCashNeeded.toLocaleString('tr-TR')} TL* (Peşinat + Tüm Masraflar)

Detaylı bilgi ve danışmanlık için her zaman yanınızdayız!
  `.trim();
}
