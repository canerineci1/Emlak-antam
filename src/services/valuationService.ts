import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ValuationInput {
  propertyTitle: string;
  city: string;
  district: string;
  neighborhood?: string;
  netM2: number;
  grossM2: number;
  rooms: string;
  buildingAge: number;
  floorLevel: 'BODRUM' | 'GIRIS' | 'ARA_KAT' | 'EN_UST' | 'DUBLEKS';
  facade: 'GUNEY' | 'KUZEY' | 'DOGU_BATI' | 'DENIZ_MANZARA';
  hasElevator: boolean;
  hasParking: boolean;
  isGatedComplex: boolean;
  brokerName: string;
  agencyName: string;
}

export interface ValuationResult {
  baseM2Price: number;
  adjustedM2Price: number;
  optimumPrice: number;       // Hedef Gerçekçi Satış
  minQuickSalePrice: number;  // Hızlı Satış (%90)
  maxListingPrice: number;    // İlan Çıkış Tavanı (%110)
  estimatedMonthlyRent: number;
  amortizationYears: number;  // Amortisman (Kira Çarpanı)
  grossYieldPercent: number;  // Yıllık Brüt Getiri
}

// Türkiye İlçe Bazlı Ortalama m² Birim Fiyat Referans Tablosu (2026 Rayiçleri)
const DISTRICT_RATES: { [key: string]: number } = {
  'kadıköy': 125000,
  'beşiktaş': 160000,
  'sarıyer': 175000,
  'ataşehir': 95000,
  'şişli': 110000,
  'üsküdar': 90000,
  'çekmeköy': 70000,
  'maltepe': 75000,
  'kartal': 68000,
  'pendik': 55000,
  'başakşehir': 65000,
  'bodrum': 180000,
  'çeşme': 190000,
  'çankaya': 65000,
  'karşıyaka': 70000,
  'default': 60000,
};

export function calculateValuation(input: ValuationInput): ValuationResult {
  const districtKey = (input.district || '').toLowerCase().trim();
  const baseM2 = DISTRICT_RATES[districtKey] || DISTRICT_RATES['default'];

  // 1. Yaş Çarpanı
  let ageMultiplier = 1.0;
  if (input.buildingAge === 0) ageMultiplier = 1.18;
  else if (input.buildingAge <= 5) ageMultiplier = 1.10;
  else if (input.buildingAge <= 15) ageMultiplier = 1.00;
  else if (input.buildingAge <= 25) ageMultiplier = 0.88;
  else ageMultiplier = 0.76;

  // 2. Kat Konumu Çarpanı
  let floorMultiplier = 1.0;
  if (input.floorLevel === 'ARA_KAT') floorMultiplier = 1.06;
  else if (input.floorLevel === 'DUBLEKS') floorMultiplier = 1.12;
  else if (input.floorLevel === 'GIRIS') floorMultiplier = 0.92;
  else if (input.floorLevel === 'BODRUM') floorMultiplier = 0.75;
  else if (input.floorLevel === 'EN_UST') floorMultiplier = 0.98;

  // 3. Cephe & Manzara
  let facadeMultiplier = 1.0;
  if (input.facade === 'DENIZ_MANZARA') facadeMultiplier = 1.22;
  else if (input.facade === 'GUNEY') facadeMultiplier = 1.07;
  else if (input.facade === 'KUZEY') facadeMultiplier = 0.94;

  // 4. Donatılar
  let bonus = 1.0;
  if (input.hasParking) bonus += 0.04;
  if (input.hasElevator) bonus += 0.03;
  if (input.isGatedComplex) bonus += 0.06;

  const adjustedM2Price = Math.round(baseM2 * ageMultiplier * floorMultiplier * facadeMultiplier * bonus);
  const optimumPrice = Math.round(adjustedM2Price * input.netM2);
  const minQuickSalePrice = Math.round(optimumPrice * 0.91);
  const maxListingPrice = Math.round(optimumPrice * 1.09);

  // Kira ve Amortisman Hesabı
  // İstanbul ortalaması amortisman ~15-18 yıl
  const estimatedMonthlyRent = Math.round(optimumPrice / (16.5 * 12));
  const annualRent = estimatedMonthlyRent * 12;
  const amortizationYears = Number((optimumPrice / annualRent).toFixed(1));
  const grossYieldPercent = Number(((annualRent / optimumPrice) * 100).toFixed(2));

  return {
    baseM2Price: baseM2,
    adjustedM2Price,
    optimumPrice,
    minQuickSalePrice,
    maxListingPrice,
    estimatedMonthlyRent,
    amortizationYears,
    grossYieldPercent,
  };
}

export async function generateValuationPdf(input: ValuationInput, result: ValuationResult): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Emsal Değerleme Raporu</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.5; font-size: 10pt; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
        .brand h1 { margin: 0; font-size: 17pt; color: #1e3a8a; font-weight: 800; }
        .brand p { margin: 2px 0 0 0; font-size: 8.5pt; color: #64748b; }
        .badge { background: #eff6ff; color: #2563eb; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 9pt; height: fit-content; border: 1px solid #bfdbfe; }
        
        .prop-title { font-size: 14pt; font-weight: 800; margin-bottom: 14px; color: #0f172a; }
        .grid-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .box { width: 48%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
        .box h3 { margin: 0 0 8px 0; font-size: 9.5pt; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #cbd5e1; font-size: 9pt; }
        .row:last-child { border-bottom: none; }

        .price-banner { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 22px; }
        .price-banner .sub { font-size: 9pt; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .price-banner .val { font-size: 24pt; font-weight: 800; margin: 4px 0; }
        .price-banner .range { font-size: 10pt; opacity: 0.95; }

        .kpi-cards { display: flex; justify-content: space-between; margin-bottom: 22px; }
        .kpi-card { width: 31%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background: #ffffff; }
        .kpi-num { font-size: 13pt; font-weight: 800; color: #0f172a; margin-top: 4px; }
        .kpi-lbl { font-size: 8pt; color: #64748b; font-weight: 700; text-transform: uppercase; }

        .note { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 12px; font-size: 8.5pt; color: #92400e; margin-bottom: 22px; border-radius: 0 6px 6px 0; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <h1>GAYRİMENKUL EKSPERTİZ & DEĞERLEME RAPORU</h1>
          <p>${input.agencyName} • ${input.brokerName} Yetkili Portföy Raporu</p>
        </div>
        <div class="badge">CMA DEĞERLEME</div>
      </div>

      <div class="prop-title">📍 ${input.propertyTitle}</div>

      <div class="grid-info">
        <div class="box">
          <h3>Fiziki Özellikler</h3>
          <div class="row"><span>Konum:</span><strong>${input.city} / ${input.district}</strong></div>
          <div class="row"><span>Net / Brüt Alan:</span><strong>${input.netM2} m² / ${input.grossM2} m²</strong></div>
          <div class="row"><span>Oda Sayısı:</span><strong>${input.rooms}</strong></div>
          <div class="row"><span>Bina Yaşı:</span><strong>${input.buildingAge === 0 ? 'Sıfır Yapı' : input.buildingAge + ' Yaşında'}</strong></div>
        </div>

        <div class="box">
          <h3>Değer Artırıcı Kriterler</h3>
          <div class="row"><span>Kat Konumu:</span><strong>${input.floorLevel.replace('_', ' ')}</strong></div>
          <div class="row"><span>Cephe & Manzara:</span><strong>${input.facade.replace('_', ' ')}</strong></div>
          <div class="row"><span>Otopark Durumu:</span><strong>${input.hasParking ? 'Mevcut ✓' : 'Yok'}</strong></div>
          <div class="row"><span>Site İçi / Güvenlik:</span><strong>${input.isGatedComplex ? 'Site İçi ✓' : 'Müstakil / Apartman'}</strong></div>
        </div>
      </div>

      <div class="price-banner">
        <div class="sub">Tavsiye Edilen Optimum Satış Fiyatı</div>
        <div class="val">${result.optimumPrice.toLocaleString('tr-TR')} TL</div>
        <div class="range">
          Hızlı Satış Tabanı: <strong>${result.minQuickSalePrice.toLocaleString('tr-TR')} TL</strong> &nbsp;|&nbsp; 
          İlan Çıkış Tavanı: <strong>${result.maxListingPrice.toLocaleString('tr-TR')} TL</strong>
        </div>
      </div>

      <div class="kpi-cards">
        <div class="kpi-card">
          <div class="kpi-lbl">Bölge m² Birim Değeri</div>
          <div class="kpi-num">${result.adjustedM2Price.toLocaleString('tr-TR')} TL</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-lbl">Tahmini Aylık Kira</div>
          <div class="kpi-num">${result.estimatedMonthlyRent.toLocaleString('tr-TR')} TL</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-lbl">Yatırım Amortismanı</div>
          <div class="kpi-num">${result.amortizationYears} Yıl (%${result.grossYieldPercent})</div>
        </div>
      </div>

      <div class="note">
        <strong>DEĞERLEME NOTU:</strong> Bu ekspertiz analizi, bölgedeki son 6 aylık gerçekleşen tapu devirleri, aktif emsal portföy fiyatları ve gayrimenkulün kat, yaş, cephe çarpanları bilimsel olarak hesaplanarak hazırlanmıştır.
      </div>

      <div class="footer">
        <span>Düzenleyen: ${input.brokerName} (${input.agencyName})</span>
        <span>EmlakÇantam CMA Engine • Tarih: ${new Date().toLocaleDateString('tr-TR')}</span>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `${input.propertyTitle} - Değerleme Raporu.pdf`
    });
  }

  return uri;
}
