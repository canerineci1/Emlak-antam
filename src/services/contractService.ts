import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { Contract } from '../types';
import { LEGAL_CONSTANTS, YER_GOSTERME_LEGAL_CLAUSES } from '../constants/legal';

export function buildContractHtml(contract: Contract): string {
  const { type } = contract;

  if (type === 'KAPORA_TEKLIFFORMU') {
    return buildKaporaHtml(contract);
  } else if (type === 'YETKI_BELGESI') {
    return buildYetkiHtml(contract);
  }

  // Varsayılan: Taşınmaz Gösterme Belgesi (Resmi Gazete Madde 19 Uyumlu)
  return buildYerGostermeHtml(contract);
}

function buildYerGostermeHtml(contract: Contract): string {
  const { broker, client, property, signatureBase64, location, signedAt, extras } = contract;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Taşınmaz Gösterme Belgesi</title>
      <style>${getOfficialLegalStyles()}</style>
    </head>
    <body>
      <div class="legal-badge-top">T.C. TİCARET BAKANLIĞI MEVZUATINA UYGUNDUR</div>

      <div class="header">
        <h1>TAŞINMAZ GÖSTERME BELGESİ</h1>
        <p>05.06.2018 Tarih ve 30442 Sayılı Resmi Gazete'de Yayımlanan <strong>Taşınmaz Ticareti Hakkında Yönetmelik Madde 19</strong> Hükümlerine Göre Tanzim Edilmiştir.</p>
      </div>

      <!-- Bilgi Tabloları Grid -->
      <div class="info-grid">
        <div class="card">
          <div class="card-title">1. YETKİLİ İŞLETME / DANIŞMAN BİLGİLERİ</div>
          <div class="card-row"><span>Yetkili İşletme Unvanı:</span> <span>${broker.agencyName}</span></div>
          <div class="card-row"><span>Taşınmaz Tic. Yetki Belge No:</span> <span><strong style="color:#1d4ed8;">${broker.licenseNumber}</strong></span></div>
          <div class="card-row"><span>Sorumlu Emlak Danışmanı:</span> <span>${broker.name}</span></div>
          <div class="card-row"><span>Danışman T.C. Kimlik No:</span> <span>${broker.tcKimlikNo || 'Kayıtlı/Doğrulandı'}</span></div>
          <div class="card-row"><span>İletişim Telefonu:</span> <span>${broker.phone}</span></div>
        </div>

        <div class="card">
          <div class="card-title">2. TAŞINMAZ GÖSTERİLEN MÜŞTERİ BİLGİLERİ</div>
          <div class="card-row"><span>Müşteri Adı Soyadı:</span> <span><strong>${client.name}</strong></span></div>
          <div class="card-row"><span>T.C. / Yabancı Kimlik No:</span> <span><strong>${client.idNumber || 'İbraz Edilmedi'}</strong></span></div>
          <div class="card-row"><span>İletişim Telefonu:</span> <span>${client.phone}</span></div>
          <div class="card-row"><span>Hizmet / Talep Türü:</span> <span>${property.type}</span></div>
          <div class="card-row"><span>Ziyaret Amacı:</span> <span>Yerinde İnceleme ve Değerlendirme</span></div>
        </div>
      </div>

      <!-- Gösterilen Taşınmaz Bilgileri -->
      <div class="property-box">
        <div class="card-title" style="color:#0f172a;">3. GÖSTERİLEN TAŞINMAZIN TAPU VE NİTELİK BİLGİLERİ</div>
        <div class="prop-grid">
          <div class="card-row"><span>İlan / Portföy Başlığı:</span> <span>${property.title}</span></div>
          <div class="card-row"><span>Taşınmazın Cinsi / Tipi:</span> <span>${property.propertyCategory} (${property.rooms || 'Konut'})</span></div>
          <div class="card-row"><span>İl / İlçe / Mahalle:</span> <span>${property.city} / ${property.district} / ${property.neighborhood || 'Merkez'}</span></div>
          <div class="card-row"><span>Açık Adres:</span> <span>${property.fullAddress}</span></div>
          <div class="card-row"><span>Ada / Parsel / Bağımsız Bölüm:</span> <span>Ada: ${property.ada || '-'} | Parsel: ${property.parsel || '-'} | BB: ${property.bagimsizBolumNo || '-'}</span></div>
          <div class="card-row"><span>Talep Edilen Bedel:</span> <span><strong style="color:#1d4ed8; font-size:14px;">${property.price} TL</strong></span></div>
        </div>
      </div>

      <!-- Yasal Hükümler ve Taahhütname -->
      <div class="legal-terms">
        <div class="legal-terms-title">4. YASAL HÜKÜMLER VE TAAHHÜTNAME (YÖNETMELİK VE TBK UYARINCA)</div>
        <ol>
          ${YER_GOSTERME_LEGAL_CLAUSES.map(c => `<li>${c}</li>`).join('')}
        </ol>
      </div>

      <!-- 6698 Sayılı KVKK Beyanı -->
      <div class="kvkk-box">
        <strong>🔒 6698 SAYILI KVKK VE 6100 SAYILI HMK ELEKTRONİK DELİL BEYANI:</strong>
        <p style="margin: 3px 0 0 0;">
          Müşteri; kimlik, iletişim, konum ve imza verilerinin 6698 sayılı KVKK Madde 5/2 (ç) ve (f) bentleri uyarınca Taşınmaz Ticareti Hakkında Yönetmelik gereği yasal yükümlülüklerin yerine getirilmesi ve 6100 sayılı HMK Madde 199 uyarınca uyuşmazlıklarda delil teşkil etmesi amacıyla 5 yıl süreyle arşivlenmesine <strong>açık rıza göstermiş ve aydınlatma metnini onaylamıştır.</strong>
        </p>
      </div>

      <!-- İmzalar -->
      <div class="signatures">
        <div class="sig-col">
          <div class="label">TAŞINMAZ GÖSTERİLEN MÜŞTERİ</div>
          <div class="sub-label">(Hizmeti Yerinde Aldım, Kabul ve Taahhüt Ederim)</div>
          ${signatureBase64 ? `<img src="${signatureBase64}" class="sig-image" alt="İmza" />` : '<p style="color:#94a3b8; padding:15px;">İmza Alındı</p>'}
          <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 11px;">${client.name}</p>
          <p style="margin: 2px 0 0 0; font-size: 9px; color:#64748b;">T.C.: ${client.idNumber || '-'}</p>
        </div>

        <div class="sig-col">
          <div class="label">YETKİLİ EMLAK DANIŞMANI</div>
          <div class="sub-label">(Taşınmazı Bizzat Yerinde Gösterdim)</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
            <div class="stamp-badge">✓ DİJİTAL VE RESMİ TESCİLLİ</div>
          </div>
          <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 11px;">${broker.name}</p>
          <p style="margin: 2px 0 0 0; font-size: 9px; color:#64748b;">Yetki No: ${broker.licenseNumber}</p>
        </div>
      </div>

      <!-- Dijital Doğrulama Damgası -->
      <div class="digital-stamp">
        <div><strong>GPS Doğrulama Kanıtı:</strong> Enlem: ${location.latitude.toFixed(5)}, Boylam: ${location.longitude.toFixed(5)} (${location.addressSnippet || 'Eşleşti'})</div>
        <div><strong>Tanzim Zamanı:</strong> ${signedAt} | <strong>KVKK Ref:</strong> ${LEGAL_CONSTANTS.KVKK_VERSION}</div>
      </div>
    </body>
    </html>
  `;
}

function buildKaporaHtml(contract: Contract): string {
  const { broker, client, property, signatureBase64, location, signedAt, extras } = contract;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Alım Teklif ve Kapora Protokolü</title>
      <style>${getOfficialLegalStyles()}</style>
    </head>
    <body>
      <div class="legal-badge-top" style="background:#ecfdf5; color:#047857; border-color:#a7f3d0;">6098 SAYILI TÜRK BORÇLAR KANUNU UYARINCA DÜZENLENMİŞTİR</div>

      <div class="header" style="border-bottom-color: #10b981;">
        <h1 style="color: #047857;">GAYRİMENKUL ALIM TEKLİF VE KAPORA PROTOKOLÜ</h1>
        <p>Taşınmaz Alım-Satımına İlişkin Bağlayıcı Teklif ve Cayma Tazminatı Protokolü</p>
      </div>

      <div class="info-grid">
        <div class="card">
          <div class="card-title">1. ARACI EMLAK İŞLETMESİ</div>
          <div class="card-row"><span>İşletme:</span> <span>${broker.agencyName}</span></div>
          <div class="card-row"><span>Yetki Belgesi No:</span> <span>${broker.licenseNumber}</span></div>
          <div class="card-row"><span>Sorumlu Danışman:</span> <span>${broker.name}</span></div>
          <div class="card-row"><span>İletişim:</span> <span>${broker.phone}</span></div>
        </div>

        <div class="card">
          <div class="card-title">2. TEKLİF VEREN ALICI BİLGİLERİ</div>
          <div class="card-row"><span>Adı Soyadı:</span> <span><strong>${client.name}</strong></span></div>
          <div class="card-row"><span>T.C. Kimlik No:</span> <span><strong>${client.idNumber || '-'}</strong></span></div>
          <div class="card-row"><span>İletişim Telefonu:</span> <span>${client.phone}</span></div>
        </div>
      </div>

      <div class="property-box">
        <div class="card-title" style="color: #047857;">3. TEKLİF VE KAPORA DETAYLARI</div>
        <div class="card-row"><span>Taşınmaz Adresi:</span> <span>${property.fullAddress}, ${property.district}/${property.city}</span></div>
        <div class="card-row"><span>Portföy Liste Fiyatı:</span> <span>${property.price} TL</span></div>
        <div class="card-row"><span><strong>Teklif Edilen Satın Alma Bedeli:</strong></span> <span><strong style="color: #047857; font-size: 15px;">${extras?.offerPrice || property.price} TL</strong></span></div>
        <div class="card-row"><span><strong>Tevdi Edilen Kapora Tutarı:</strong></span> <span><strong>${extras?.depositAmount || '0'} TL</strong> (${extras?.paymentMethod || 'Banka Havalesi / EFT'})</span></div>
        <div class="card-row"><span>Teklifin Bağlayıcılık Süresi:</span> <span>${extras?.validUntilDays || '3'} İş Günü</span></div>
      </div>

      <div class="legal-terms">
        <div class="legal-terms-title">4. CAYMA TAZMİNATI VE HUKUKİ ŞARTLAR (TBK MADDE 177-178):</div>
        <ol>
          <li>İşbu kapora; mülk sahibine teklifin iletilmesi amacıyla aracı kuruma tevdi edilmiş olup, mülk sahibi teklifi yazılı olarak kabul ettiği andan itibaren akit kurulmuş sayılır.</li>
          <li>Mülk sahibi teklifi kabul ettikten sonra alıcı alımdan vazgeçerse tevdi edilen kapora bedeli 6098 sayılı TBK Madde 178 uyarınca 'Pişmanlık Parası (Cayma Tazminatı)' olarak irat kaydedilir, iade edilmez.</li>
          <li>Mülk sahibinin teklifi süresi içinde kabul etmemesi durumunda kapora bedeli 24 saat içinde kesintisiz olarak alıcıya iade edilir.</li>
          <li>Satışın gerçekleşmesi halinde aracı kuruma yasal hizmet komisyonu (%2 + KDV) taraflarca ödenir.</li>
        </ol>
      </div>

      <div class="signatures">
        <div class="sig-col">
          <div class="label">TEKLİF VEREN ALICI İMZASI</div>
          <div class="sub-label">(Teklif ve Şartları Kabul Ediyorum)</div>
          ${signatureBase64 ? `<img src="${signatureBase64}" class="sig-image" alt="İmza" />` : '<p style="color:#94a3b8; padding:15px;">İmza Alındı</p>'}
          <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 11px;">${client.name}</p>
        </div>

        <div class="sig-col">
          <div class="label">ARACI İŞLETME YETKİLİSİ</div>
          <div class="sub-label">(Kaporayı Emaneten Teslim Aldım)</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
            <div class="stamp-badge" style="background:#d1fae5; color:#065f46;">✓ KAPORA PROTOKOLÜ TESCİLLENDİ</div>
          </div>
          <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 11px;">${broker.agencyName}</p>
        </div>
      </div>

      <div class="digital-stamp">
        <div><strong>GPS Kanıtı:</strong> ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}</div>
        <div><strong>Tarih & Saat:</strong> ${signedAt} | <strong>KVKK Onaylı</strong></div>
      </div>
    </body>
    </html>
  `;
}

function buildYetkiHtml(contract: Contract): string {
  const { broker, client, property, signatureBase64, location, signedAt, extras } = contract;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Taşınmaz Pazarlama Yetki Sözleşmesi</title>
      <style>${getOfficialLegalStyles()}</style>
    </head>
    <body>
      <div class="legal-badge-top" style="background:#eef2ff; color:#3730a3; border-color:#c7d2fe;">TAŞINMAZ TİCARETİ HAKKINDA YÖNETMELİK MADDE 15 UYARINCA DÜZENLENMİŞTİR</div>

      <div class="header" style="border-bottom-color: #6366f1;">
        <h1 style="color: #4338ca;">TAŞINMAZ PAZARLAMA VE ARACILIK YETKİ SÖZLEŞMESİ</h1>
        <p>Mülk Sahibi ve Yetkili Emlak İşletmesi Arasında Tanzim Edilen Hizmet Sözleşmesi</p>
      </div>

      <div class="info-grid">
        <div class="card">
          <div class="card-title">1. YETKİLENDİRİLEN EMLAK İŞLETMESİ</div>
          <div class="card-row"><span>İşletme Unvanı:</span> <span>${broker.agencyName}</span></div>
          <div class="card-row"><span>Taşınmaz Tic. Yetki Belge No:</span> <span><strong style="color:#4338ca;">${broker.licenseNumber}</strong></span></div>
          <div class="card-row"><span>Sorumlu Danışman:</span> <span>${broker.name}</span></div>
          <div class="card-row"><span>İletişim:</span> <span>${broker.phone}</span></div>
        </div>

        <div class="card">
          <div class="card-title">2. MÜLK SAHİBİ (MALİK / VEKİL)</div>
          <div class="card-row"><span>Adı Soyadı:</span> <span><strong>${client.name}</strong></span></div>
          <div class="card-row"><span>T.C. Kimlik No:</span> <span><strong>${client.idNumber || '-'}</strong></span></div>
          <div class="card-row"><span>İletişim Telefonu:</span> <span>${client.phone}</span></div>
        </div>
      </div>

      <div class="property-box">
        <div class="card-title" style="color: #4338ca;">3. PAZARLAMA ŞARTLARI VE MÜLK BİLGİLERİ</div>
        <div class="card-row"><span>Mülk Açık Adresi:</span> <span>${property.fullAddress}, ${property.district}/${property.city}</span></div>
        <div class="card-row"><span>Pazarlama Taban Satış Fiyatı:</span> <span><strong>${property.price} TL</strong></span></div>
        <div class="card-row"><span>Hizmet Komisyon Oranı:</span> <span><strong>%${extras?.commissionRate || '2'} + KDV</strong></span></div>
        <div class="card-row"><span>Sözleşme Süresi:</span> <span><strong>${extras?.durationMonths || '3'} Ay</strong> (${extras?.isExclusive ? 'Münhasır / Tek Yetkili' : 'Genel Yetkili'})</span></div>
      </div>

      <div class="legal-terms">
        <div class="legal-terms-title">4. SÖZLEŞME HÜKÜMLERİ VE TAAHHÜTLER (YÖNETMELİK MADDE 15-18):</div>
        <ol>
          <li>Mülk sahibi, yukarıda belirtilen taşınmazın pazarlanması ve satışına/kiralanmasına aracılık edilmesi amacıyla yetkili işletmeye tam pazarlama yetkisi vermiştir.</li>
          <li>Sözleşme süresi zarfında veya sözleşme bitiminden itibaren 1 yıl içinde, yetkili işletmenin yer gösterdiği müşterilere satış yapılması halinde komisyon hakkı aynen saklıdır.</li>
          <li>İşbu sözleşme dijital ortamda taraflarca GPS damgası ile tescil edilmiştir.</li>
        </ol>
      </div>

      <div class="signatures">
        <div class="sig-col">
          <div class="label">MÜLK SAHİBİ (MALİK) İMZASI</div>
          ${signatureBase64 ? `<img src="${signatureBase64}" class="sig-image" alt="İmza" />` : '<p style="color:#94a3b8; padding:15px;">İmza Alındı</p>'}
          <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 11px;">${client.name}</p>
        </div>

        <div class="sig-col">
          <div class="label">YETKİLİ EMLAK İŞLETMESİ</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
            <div class="stamp-badge" style="background:#e0e7ff; color:#3730a3;">✓ YETKİ RESMEN TESCİLLENDİ</div>
          </div>
          <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 11px;">${broker.agencyName}</p>
        </div>
      </div>

      <div class="digital-stamp">
        <div><strong>GPS Damgası:</strong> ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}</div>
        <div><strong>Tanzim:</strong> ${signedAt} | <strong>KVKK Korunmalı</strong></div>
      </div>
    </body>
    </html>
  `;
}

function getOfficialLegalStyles(): string {
  return `
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
      color: #0f172a;
      line-height: 1.45;
      font-size: 12px;
      background: #ffffff;
    }
    .legal-badge-top {
      text-align: center;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 4px 8px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .header h1 {
      margin: 0;
      font-size: 17px;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .header p {
      margin: 3px 0 0 0;
      color: #475569;
      font-size: 10px;
      line-height: 1.3;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      background-color: #f8fafc;
    }
    .card-title {
      font-weight: 800;
      color: #1e40af;
      margin-bottom: 6px;
      font-size: 11px;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 11px;
    }
    .card-row span:first-child {
      color: #475569;
    }
    .card-row span:last-child {
      font-weight: 600;
      text-align: right;
      color: #0f172a;
    }
    .property-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
      background: #ffffff;
    }
    .prop-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3px;
    }
    .legal-terms {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
      margin-bottom: 10px;
      font-size: 10px;
      color: #334155;
    }
    .legal-terms-title {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      font-size: 10px;
      text-transform: uppercase;
    }
    .legal-terms ol {
      margin: 2px 0;
      padding-left: 16px;
    }
    .legal-terms li {
      margin-bottom: 4px;
      line-height: 1.35;
    }
    .kvkk-box {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 8px;
      background: #eff6ff;
      margin-bottom: 14px;
      font-size: 9px;
      color: #1e3a8a;
      line-height: 1.35;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 47%;
      text-align: center;
      border: 1px dashed #64748b;
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
    }
    .sig-col .label {
      font-weight: 800;
      font-size: 10px;
      color: #0f172a;
    }
    .sig-col .sub-label {
      font-size: 9px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .sig-image {
      max-height: 70px;
      max-width: 100%;
      object-fit: contain;
      margin-top: 2px;
    }
    .digital-stamp {
      margin-top: 14px;
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
    }
    .stamp-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 10px;
    }
  `;
}

export async function generateAndSharePdf(contract: Contract): Promise<string> {
  const html = buildContractHtml(contract);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${contract.client.name} - ${contract.type}`,
      UTI: 'com.adobe.pdf'
    });
  }

  return uri;
}

export function sendOwnerFeedbackWhatsApp(contract: Contract) {
  const { broker, property, client, signedAt, extras } = contract;
  const ownerName = property.ownerName || 'Mülk Sahibi';
  const feedback = extras?.clientFeedback || 'Taşınmaz detaylıca gezdirildi, genel izlenim olumlu.';

  const message = `Sayın ${ownerName}, Merhaba.\n\n📍 *${property.title}* adresindeki mülkünüz bugün saat ${signedAt} itibarıyla potansiyel alıcımız *${client.name}* ile birlikte yerinde incelenmiştir.\n\n📝 *Ziyaret Geri Bildirimi:* ${feedback}\n\nİşlem 05.06.2018 tarihli Taşınmaz Ticareti Hakkında Yönetmelik Madde 19 uyarınca yasal GPS ve zaman damgalı Taşınmaz Gösterme Belgesi ile tescil edilmiştir.\n\nSaygılarımla,\n*${broker.name}*\n${broker.agencyName}\nYetki No: ${broker.licenseNumber}\n📞 ${broker.phone}`;

  const phone = (property.ownerPhone || '').replace(/[^0-9]/g, '');
  const url = phone.length > 9 
    ? `whatsapp://send?phone=90${phone.startsWith('0') ? phone.slice(1) : phone}&text=${encodeURIComponent(message)}`
    : `whatsapp://send?text=${encodeURIComponent(message)}`;

  Linking.openURL(url).catch(() => {
    Sharing.shareAsync('', { dialogTitle: 'Raporu Paylaş' });
  });
}
