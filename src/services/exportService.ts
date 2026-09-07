import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Contract } from '../types';
import { Alert } from 'react-native';

export async function exportContractsToCSV(contracts: Contract[]): Promise<string> {
  const headers = [
    'Sözleşme ID',
    'Tür',
    'Tarih / Saat',
    'Müşteri Ad Soyad',
    'Müşteri Telefon',
    'Müşteri TC No',
    'Taşınmaz Başlığı',
    'İl / İlçe',
    'Açık Adres',
    'Ada / Parsel',
    'Fiyat (TL)',
    'Teklif / Kapora (TL)',
    'GPS Enlem',
    'GPS Boylam',
    'GPS Adres',
    'Danışman',
    'Yetki No',
    'Durum'
  ];

  const rows = contracts.map(c => [
    `"${c.id}"`,
    `"${c.type}"`,
    `"${c.signedAt}"`,
    `"${c.client.name}"`,
    `"${c.client.phone}"`,
    `"${c.client.idNumber || '-'}"`,
    `"${c.property.title.replace(/"/g, '""')}"`,
    `"${c.property.city} / ${c.property.district}"`,
    `"${c.property.fullAddress.replace(/"/g, '""')}"`,
    `"${c.property.ada || '-'}/${c.property.parsel || '-'}"`,
    `"${c.property.price}"`,
    `"${c.extras?.offerPrice || '-'}"`,
    `"${c.location.latitude}"`,
    `"${c.location.longitude}"`,
    `"${(c.location.addressSnippet || '').replace(/"/g, '""')}"`,
    `"${c.broker.name}"`,
    `"${c.broker.licenseNumber}"`,
    `"${c.status}"`
  ]);

  const BOM = '\uFEFF';
  const csvContent = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');

  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  const fileUri = `${dir}EmlakCantam_Sozlesmeler_${Date.now()}.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Sözleşme Listesini Excel / CSV Olarak Dışa Aktar',
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    Alert.alert('Başarılı', `CSV dosyası oluşturuldu.`);
  }

  return fileUri;
}
