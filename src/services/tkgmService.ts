import { Property } from '../types';
import { Linking, Alert } from 'react-native';

export function openTkgmParselSorgu(property: Property) {
  // Resmi TKGM Parsel Sorgu URL'i
  const baseUrl = 'https://parselsorgu.tkgm.gov.tr/';
  Linking.openURL(baseUrl).catch(() => {
    Alert.alert('Bilgi', 'TKGM Parsel Sorgu sayfası açılamadı.');
  });
}

export function openPropertyOnGoogleMaps(property: Property) {
  const query = encodeURIComponent(`${property.fullAddress}, ${property.district}, ${property.city}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  Linking.openURL(mapsUrl).catch(() => {
    Alert.alert('Bilgi', 'Harita uygulaması açılamadı.');
  });
}
