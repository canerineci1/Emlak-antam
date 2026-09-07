import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Property, BrokerProfile, ClientInfo } from '../types';

export interface MeterIndex {
  meterNumber: string;
  lastReading: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  status: 'EKSİKSİZ' | 'HASARLI' | 'YOK';
  notes?: string;
}

export interface InventoryReportData {
  id: string;
  property: Property;
  broker: BrokerProfile;
  tenant: ClientInfo;
  landlord: ClientInfo;
  deliveryDate: string;
  
  // Sayaçlar
  electricityMeter: MeterIndex;
  waterMeter: MeterIndex;
  gasMeter: MeterIndex;
  
  // Demirbaşlar
  keyCountMain: string;
  keyCountBackup: string;
  paintCondition: 'YENİ_BOYALI' | 'BOYA_GEREKLİ' | 'ORTA';
  items: InventoryItem[];
  generalNotes?: string;
  tenantSignatureBase64?: string;
}

export function buildInventoryHtml(data: InventoryReportData): string {
  const { property, broker, tenant, landlord, deliveryDate, electricityMeter, waterMeter, gasMeter, keyCountMain, keyCountBackup, paintCondition, items, generalNotes, tenantSignatureBase64 } = data;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Taşınmaz ve Demirbaş Teslim Tutanağı</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; font-size: 11px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { margin: 0; font-size: 16px; color: #1e3a8a; text-transform: uppercase; }
        .section-title { font-weight: 800; color: #1e40af; font-size: 11px; text-transform: uppercase; margin: 10px 0 4px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .card { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 8px; background: #f8fafc; font-size: 10px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
        th { background: #eff6ff; color: #1e40af; font-weight: 700; }
        .signatures { display: flex; justify-content: space-between; margin-top: 14px; }
        .sig-col { width: 47%; text-align: center; border: 1px dashed #64748b; padding: 8px; border-radius: 4px; }
        .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 3px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TAŞINMAZ VE DEMİRBAŞ TESLİM TESELLÜM TUTANAĞI</h1>
        <p>Taşınmazın ve İçerisinde Yer Alan Demirbaşların Teslim Anındaki Durum Tespiti</p>
      </div>

      <div class="grid">
        <div class="card">
          <div class="row"><span><strong>Taşınmaz:</strong></span> <span>${property.title}</span></div>
          <div class="row"><span><strong>Adres:</strong></span> <span>${property.fullAddress}</span></div>
          <div class="row"><span><strong>Teslim Tarihi:</strong></span> <span>${deliveryDate}</span></div>
        </div>
        <div class="card">
          <div class="row"><span><strong>Kiracı:</strong></span> <span>${tenant.name} (${tenant.phone})</span></div>
          <div class="row"><span><strong>Mülk Sahibi:</strong></span> <span>${landlord.name} (${landlord.phone})</span></div>
          <div class="row"><span><strong>Aracı İşletme:</strong></span> <span>${broker.agencyName}</span></div>
        </div>
      </div>

      <div class="section-title">1. TESLİM ANI SAYAÇ ENDEKSLERİ</div>
      <table>
        <tr>
          <th>Sayaç Türü</th>
          <th>Sayaç Numarası</th>
          <th>Teslim Anı Son Endeks</th>
        </tr>
        <tr>
          <td>Elektrik Sayacı</td>
          <td>${electricityMeter.meterNumber || '-'}</td>
          <td><strong>${electricityMeter.lastReading || '-'} kWh</strong></td>
        </tr>
        <tr>
          <td>Su Sayacı</td>
          <td>${waterMeter.meterNumber || '-'}</td>
          <td><strong>${waterMeter.lastReading || '-'} m³</strong></td>
        </tr>
        <tr>
          <td>Doğalgaz Sayacı</td>
          <td>${gasMeter.meterNumber || '-'}</td>
          <td><strong>${gasMeter.lastReading || '-'} m³</strong></td>
        </tr>
      </table>

      <div class="section-title">2. MÜLK VE DEMİRBAŞ DURUM LİSTESİ</div>
      <div class="card" style="margin-bottom: 6px;">
        <div class="row"><span><strong>Boya Durumu:</strong> ${paintCondition === 'YENİ_BOYALI' ? 'Yeni Boyalı / Tertemiz' : paintCondition === 'BOYA_GEREKLİ' ? 'Boya İhtiyacı Var' : 'Kullanıma Uygun'}</span>
        <span><strong>Teslim Edilen Anahtar:</strong> ${keyCountMain} Asıl + ${keyCountBackup} Yedek</span></div>
      </div>

      <table>
        <tr>
          <th>Demirbaş / Cihaz</th>
          <th>Teslim Durumu</th>
          <th>Açıklama / Not</th>
        </tr>
        ${items.map(item => `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td><span class="badge">${item.status}</span></td>
            <td>${item.notes || 'Sorunsuz çalışır vaziyette'}</td>
          </tr>
        `).join('')}
      </table>

      ${generalNotes ? `<div class="card" style="margin-top: 6px;"><strong>Genel Tespit Notları:</strong> ${generalNotes}</div>` : ''}

      <div class="signatures">
        <div class="sig-col">
          <strong>TESLİM ALAN (KİRACI)</strong>
          <p style="font-size:9px; color:#64748b; margin:2px 0 6px 0;">Yukarıdaki demirbaşları eksiksiz teslim aldım.</p>
          ${tenantSignatureBase64 ? `<img src="${tenantSignatureBase64}" style="max-height:50px;" />` : '<p style="padding:10px;">İmza Alındı</p>'}
          <p style="margin:2px 0 0 0; font-weight:700;">${tenant.name}</p>
        </div>

        <div class="sig-col">
          <strong>TESLİM EDEN (MALİK / ARACI İŞLETME)</strong>
          <p style="font-size:9px; color:#64748b; margin:2px 0 6px 0;">Taşınmaz belirtilen şartlarla teslim edilmiştir.</p>
          <div style="height:45px; display:flex; align-items:center; justify-content:center;">
            <span class="badge">✓ RESMİ TESCİLLENDİ</span>
          </div>
          <p style="margin:2px 0 0 0; font-weight:700;">${broker.name}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function generateAndShareInventoryPdf(data: InventoryReportData): Promise<string> {
  const html = buildInventoryHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${data.tenant.name} - Demirbaş Teslim Tutanağı`,
      UTI: 'com.adobe.pdf'
    });
  }

  return uri;
}
