import * as Location from 'expo-location';
import { LocationData } from '../types';

export async function getCurrentLocationWithAddress(): Promise<LocationData> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: 41.0082,
        longitude: 28.9784,
        addressSnippet: 'Konum izni verilmedi (Varsayılan: İstanbul)'
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = location.coords.latitude;
    const lng = location.coords.longitude;

    try {
      const reverse = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        const snippet = `${item.district || item.subregion || ''}, ${item.city || item.region || ''} (${item.street || ''})`;
        return {
          latitude: lat,
          longitude: lng,
          addressSnippet: snippet.trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        };
      }
    } catch {
      // Reverse geocode fallback
    }

    return {
      latitude: lat,
      longitude: lng,
      addressSnippet: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    };
  } catch (error) {
    console.warn('Konum alma hatası:', error);
    return {
      latitude: 41.0082,
      longitude: 28.9784,
      addressSnippet: 'Konum alınamadı'
    };
  }
}
