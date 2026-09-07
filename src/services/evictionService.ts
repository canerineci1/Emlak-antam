import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface EvictionData {
  id: string;
  landlordName: string;
  landlordTc: string;
  tenantName: string;
  tenantTc: string;
  tenantPhone: string;
  propertyAddress: string;
  leaseStartDate: string;      // Kira Başlangıç Tarihi
  commitmentDate: string;      // Taahhüt Düzenleme Tarihi (Kira başlangıcından sonra olmalı)
  evictionDate: string;        // Tahliye Edileceği Tarih
  penaltyPerDay?: string;      // Gecikilen Her Gün İçin Cezai Şart (TL)
  hasGuarantorConsent?: boolean; // Eş / Kefil Muvafakati
  guarantorName?: string;
  guarantorTc?: string;
  signatureBase64?: string;
  signedAt?: string;
}

export function validateEvictionDates(leaseStart: string, commitment: string, eviction: string): { isValid: boolean; message: string } {
  // Tarihleri kıyasla
  const start = new Date(leaseStart.split('.').reverse().join('-'));
  const commit = new Date(commitment.split('.').reverse().join('-'));
  const evict = new Date(eviction.split('.').reverse().join('-'));

  if (isNaN(start.getTime()) || isNaN(commit.getTime()) || isNaN(evict.getTime())) {
    return { isValid: false, message: 'Lütfen geçerli GG.AA.YYYY formatında tarih giriniz.' };
  }

  // Yargıtay Kuralı: Taahhüt tarihi kira başlangıcından sonra olmalıdır (baskı altında imza sayılmaması için)
  if (commit <= start) {
    return { 
      isValid: false, 
      message: 'YARGITAY KURALI: Taahhüt düzenleme tarihi kira başlangıç tarihinden sonraki bir tarih olmalıdır. Aynı gün veya öncesi düzenlenen taahhütnameler hukuken geçersiz sayılır (TBK m. 352).' 
    };
  }

  if (evict <= commit) {
    return { 
      isValid: false, 
      message: 'Tahliye tarihi, taahhüt düzenleme tarihinden ileri bir tarih olmalıdır.' 
    };
  }

  return { isValid: true, message: 'Tarihler yasal mevzuata uygundur.' };
}

export async function generateEvictionPdf(data: EvictionData): Promise<string> {
  const penaltyClause = data.penaltyPerDay 
    ? `<p class="clause"><strong>3. CEZAİ ŞART:</strong> Belirtilen tahliye tarihinde taşınmazın tahliye ve teslim edilmemesi halinde, kiracı taşınmazda fuzulen işgal ettiği her geçen gün için <strong>${data.penaltyPerDay} TL</strong> cezai şart ve ecrimisil tazminatını malike nakden ve defaten ödemeyi gayrikabili rücu kabul, beyan ve taahhüt eder.</p>`
    : '';

  const guarantorBlock = data.hasGuarantorConsent && data.guarantorName
    ? `
      <div class="sig-box">
        <p class="sig-title">EŞ / KEFİL MUVAFAKATİ</p>
        <p class="sig-sub">Ad Soyad: ${data.guarantorName}</p>
        <p class="sig-sub">T.C. Kimlik: ${data.guarantorTc || '-'}</p>
        <p class="sig-note">Türk Medeni Kanunu m. 194 uyarınca aile konutu niteliğindeki taşınmazın tahliyesine rıza gösteriyorum.</p>
        <div class="sig-line">İmza</div>
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Tahliye Taahhütnamesi</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18pt; font-weight: 800; letter-spacing: 1px; color: #0f172a; }
        .header p { margin: 4px 0 0 0; font-size: 9pt; color: #64748b; }
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        .table-info td { padding: 7px 10px; border: 1px solid #cbd5e1; font-size: 10pt; }
        .table-info td.lbl { width: 32%; font-weight: 700; background-color: #f8fafc; color: #334155; }
        .clause { margin-bottom: 12px; text-align: justify; font-size: 10.5pt; }
        .warning-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 12px; font-size: 8.5pt; color: #991b1b; margin-top: 14px; margin-bottom: 18px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
        .sig-box { width: 46%; border: 1px dashed #94a3b8; padding: 12px; text-align: center; border-radius: 6px; }
        .sig-title { font-weight: 800; font-size: 10pt; margin-bottom: 4px; color: #0f172a; }
        .sig-sub { font-size: 9pt; color: #475569; margin: 2px 0; }
        .sig-note { font-size: 8pt; color: #64748b; font-style: italic; margin-top: 6px; }
        .sig-img { max-height: 55px; margin: 10px 0; }
        .sig-line { border-top: 1px solid #cbd5e1; margin-top: 25px; padding-top: 4px; font-size: 8.5pt; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TAHLİYE TAAHHÜTNAMESİ</h1>
        <p>6098 Sayılı Türk Borçlar Kanunu Madde 352 Hükümlerine Uygundur</p>
      </div>

      <table class="table-info">
        <tr>
          <td class="lbl">KİRAYA VEREN (MALİK)</td>
          <td>${data.landlordName} &nbsp;|&nbsp; <strong>TC:</strong> ${data.landlordTc}</td>
        </tr>
        <tr>
          <td class="lbl">KİRACI (TAAHHÜT EDEN)</td>
          <td>${data.tenantName} &nbsp;|&nbsp; <strong>TC:</strong> ${data.tenantTc} &nbsp;|&nbsp; <strong>Tel:</strong> ${data.tenantPhone}</td>
        </tr>
        <tr>
          <td class="lbl">TAŞINMAZIN ADRESİ</td>
          <td>${data.propertyAddress}</td>
        </tr>
        <tr>
          <td class="lbl">KİRA BAŞLANGIÇ TARİHİ</td>
          <td><strong>${data.leaseStartDate}</strong></td>
        </tr>
        <tr>
          <td class="lbl">DÜZENLENME TARİHİ</td>
          <td><strong>${data.commitmentDate}</strong> (Kira başlangıcından sonra tanzim edilmiştir)</td>
        </tr>
        <tr>
          <td class="lbl">TAHLİYE TARİHİ</td>
          <td><strong style="color: #dc2626; font-size: 11pt;">${data.evictionDate}</strong></td>
        </tr>
      </table>

      <div class="clause">
        <strong>1. TAHLİYE TAAHHÜDÜ:</strong> Halen kiracı sıfatıyla oturmakta/kullanmakta olduğum yukarıda açık adresi yazılı bulunan taşınmazı hiçbir ihtar, ihbar veya mahkeme kararına gerek kalmaksızın, <strong>${data.evictionDate}</strong> tarihinde tamamen tahliye ederek, boş, temiz ve anahtarlarını eksiksiz olarak kiraya verene (veya kanuni vekiline) teslim edeceğimi gayrikabili rücu kabul, beyan ve taahhüt ederim.
      </div>

      <div class="clause">
        <strong>2. SERBEST İRADE BEYANI:</strong> İşbu tahliye taahhütnamesi, kira sözleşmesinin imzalanmasından ve taşınmaza yerleşilmesinden sonra, herhangi bir baskı, cebir veya zorlama altında kalmaksızın, kendi hür ve serbest iradem ile tanzim ve imza edilmiştir (Yargıtay Hukuk Genel Kurulu kararları doğrultusunda).
      </div>

      ${penaltyClause}

      <div class="warning-box">
        <strong>YASAL UYARI (TBK Madde 352/1):</strong> Kiracı, taahhüt ettiği tarihte taşınmazı boşaltmazsa; kiraya veren bu tarihten itibaren bir ay içinde icraya başvurarak veya dava açarak kira sözleşmesini sona erdirebilir.
      </div>

      <div class="signatures">
        <div class="sig-box">
          <p class="sig-title">TAAHHÜT EDEN (KİRACI)</p>
          <p class="sig-sub">Ad Soyad: ${data.tenantName}</p>
          <p class="sig-sub">T.C. Kimlik: ${data.tenantTc}</p>
          ${data.signatureBase64 ? `<img class="sig-img" src="${data.signatureBase64}" />` : '<div class="sig-line">İmza</div>'}
        </div>

        ${guarantorBlock || `
          <div class="sig-box">
            <p class="sig-title">KİRAYA VEREN (MALİK)</p>
            <p class="sig-sub">Ad Soyad: ${data.landlordName}</p>
            <p class="sig-sub">T.C. Kimlik: ${data.landlordTc}</p>
            <div class="sig-line">Teslim Alan İmza</div>
          </div>
        `}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `${data.tenantName} - Tahliye Taahhütnamesi.pdf`
    });
  }

  return uri;
}
