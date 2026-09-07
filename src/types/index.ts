export type ContractType = 'YER_GOSTERME' | 'YETKI_BELGESI' | 'KAPORA_TEKLIFFORMU';

export interface BrokerProfile {
  id: string;
  name: string;
  tcKimlikNo?: string; // Sorumlu Danışman T.C. Kimlik No (Yönetmelik m. 19 zorunlu)
  agencyName: string;
  phone: string;
  email: string;
  licenseNumber: string; // Taşınmaz Ticareti Yetki Belgesi No (Zorunlu)
  address?: string;
  logoUrl?: string;
}

export interface Property {
  id: string;
  title: string;
  city: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
  ada?: string;
  parsel?: string;
  bagimsizBolumNo?: string;
  price: string;
  type: 'SATILIK' | 'KIRALIK';
  propertyCategory: 'DAIRE' | 'VILLA' | 'ARSA' | 'ISYERI';
  rooms?: string;
  squareMeters?: string;
  features?: string[];
  ownerName?: string;
  ownerPhone?: string;
}

export interface ClientInfo {
  name: string;
  phone: string;
  idNumber?: string; // T.C. Kimlik / Yabancı Kimlik No (Yönetmelik m. 19 zorunlu)
}

export interface LocationData {
  latitude: number;
  longitude: number;
  addressSnippet?: string;
  accuracyMeters?: number;
}

export interface ContractExtraDetails {
  // Kapora & Teklif Detayları
  offerPrice?: string;
  depositAmount?: string;
  validUntilDays?: string;
  paymentMethod?: string;
  
  // Yetki Sözleşmesi Detayları
  commissionRate?: string;
  durationMonths?: string;
  isExclusive?: boolean;

  // Gösterim Geri Bildirimi
  clientFeedback?: string;

  // KVKK Onay Beyanı
  kvkkApprovedAt?: string;
  kvkkVersion?: string;
}

export interface Contract {
  id: string;
  type: ContractType;
  property: Property;
  broker: BrokerProfile;
  client: ClientInfo;
  signatureBase64: string;
  location: LocationData;
  signedAt: string;
  pdfUri?: string;
  status: 'COMPLETED' | 'DRAFT' | 'CANCELLED';
  extras?: ContractExtraDetails;
  notes?: string;
}

export interface BuyerDemand {
  id: string;
  clientName: string;
  clientPhone: string;
  targetCity: string;
  targetDistrict: string;
  maxBudget: number;
  type: 'SATILIK' | 'KIRALIK';
  preferredRooms: string;
  notes: string;
  createdAt: string;
}

export interface MatchResult {
  demand: BuyerDemand;
  matchScore: number;
  matchReasons: string[];
}
