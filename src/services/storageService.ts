import { Contract, Property, BrokerProfile, BuyerDemand } from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import {
  syncContractToCloud,
  deleteContractFromCloud,
  syncPropertyToCloud,
  deletePropertyFromCloud,
  syncDemandToCloud,
  deleteDemandFromCloud,
  syncBrokerToCloud,
  fetchCollectionFromCloud
} from './firebaseSyncService';

const CONTRACTS_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_contracts.json';
const PROPERTIES_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_properties.json';
const DEMANDS_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_demands.json';
const BROKER_FILE = (FileSystem.documentDirectory || '') + 'emlakofisim_broker.json';

const EMPTY_BROKER: BrokerProfile = {
  id: 'broker_profile',
  name: '',
  tcKimlikNo: '',
  agencyName: 'EmlakÇantam Gayrimenkul',
  phone: '',
  email: '',
  licenseNumber: ''
};

class ContractStore {
  private contracts: Contract[] = [];
  private properties: Property[] = [];
  private demands: BuyerDemand[] = [];
  private broker: BrokerProfile = { ...EMPTY_BROKER };
  private listeners: Set<() => void> = new Set();
  private isLoaded: boolean = false;

  constructor() {
    this.init();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.warn('Store listener error:', e);
      }
    });
  }

  // İlk Yükleme: Önce Cihaz Hafızasından Hızlıca Oku, Ardından Firestore Bulutundan Çek
  public async init() {
    if (this.isLoaded) return;
    this.isLoaded = true;

    await this.loadLocalCache();
    await this.syncWithCloud();
  }

  // Cihaz Hafızasından Yerel Olarak Yükle
  private async loadLocalCache() {
    try {
      const cInfo = await FileSystem.getInfoAsync(CONTRACTS_FILE);
      if (cInfo.exists) {
        const cData = await FileSystem.readAsStringAsync(CONTRACTS_FILE, { encoding: FileSystem.EncodingType.UTF8 });
        const parsed = JSON.parse(cData);
        if (Array.isArray(parsed)) this.contracts = parsed;
      }

      const pInfo = await FileSystem.getInfoAsync(PROPERTIES_FILE);
      if (pInfo.exists) {
        const pData = await FileSystem.readAsStringAsync(PROPERTIES_FILE, { encoding: FileSystem.EncodingType.UTF8 });
        const parsed = JSON.parse(pData);
        if (Array.isArray(parsed)) this.properties = parsed;
      }

      const dInfo = await FileSystem.getInfoAsync(DEMANDS_FILE);
      if (dInfo.exists) {
        const dData = await FileSystem.readAsStringAsync(DEMANDS_FILE, { encoding: FileSystem.EncodingType.UTF8 });
        const parsed = JSON.parse(dData);
        if (Array.isArray(parsed)) this.demands = parsed;
      }

      const bInfo = await FileSystem.getInfoAsync(BROKER_FILE);
      if (bInfo.exists) {
        const bData = await FileSystem.readAsStringAsync(BROKER_FILE, { encoding: FileSystem.EncodingType.UTF8 });
        const parsed = JSON.parse(bData);
        if (parsed && typeof parsed === 'object') this.broker = { ...EMPTY_BROKER, ...parsed };
      }

      this.notify();
    } catch (e) {
      console.warn('Store local cache load error:', e);
    }
  }

  // Canlı Firestore Bulutundan Çek ve Eşitle
  public async syncWithCloud() {
    try {
      const [cloudContracts, cloudProps, cloudDemands, cloudBrokers] = await Promise.all([
        fetchCollectionFromCloud<Contract>('contracts'),
        fetchCollectionFromCloud<Property>('properties'),
        fetchCollectionFromCloud<BuyerDemand>('demands'),
        fetchCollectionFromCloud<BrokerProfile>('brokers')
      ]);

      let changed = false;

      if (cloudContracts.length > 0) {
        // En güncel olanları birleştir
        const map = new Map<string, Contract>();
        this.contracts.forEach(c => map.set(c.id, c));
        cloudContracts.forEach(c => map.set(c.id, c));
        this.contracts = Array.from(map.values());
        await this.saveContractsLocal();
        changed = true;
      }

      if (cloudProps.length > 0) {
        const map = new Map<string, Property>();
        this.properties.forEach(p => map.set(p.id, p));
        cloudProps.forEach(p => map.set(p.id, p));
        this.properties = Array.from(map.values());
        await this.savePropertiesLocal();
        changed = true;
      }

      if (cloudDemands.length > 0) {
        const map = new Map<string, BuyerDemand>();
        this.demands.forEach(d => map.set(d.id, d));
        cloudDemands.forEach(d => map.set(d.id, d));
        this.demands = Array.from(map.values());
        await this.saveDemandsLocal();
        changed = true;
      }

      if (cloudBrokers.length > 0) {
        this.broker = { ...this.broker, ...cloudBrokers[0] };
        await this.saveBrokerLocal();
        changed = true;
      }

      if (changed) {
        this.notify();
      }
    } catch (e) {
      console.warn('Store cloud sync error:', e);
    }
  }

  private async saveContractsLocal() {
    try {
      await FileSystem.writeAsStringAsync(CONTRACTS_FILE, JSON.stringify(this.contracts, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (e) {
      console.warn('Save contracts local error:', e);
    }
  }

  private async savePropertiesLocal() {
    try {
      await FileSystem.writeAsStringAsync(PROPERTIES_FILE, JSON.stringify(this.properties, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (e) {
      console.warn('Save properties local error:', e);
    }
  }

  private async saveDemandsLocal() {
    try {
      await FileSystem.writeAsStringAsync(DEMANDS_FILE, JSON.stringify(this.demands, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (e) {
      console.warn('Save demands local error:', e);
    }
  }

  private async saveBrokerLocal() {
    try {
      await FileSystem.writeAsStringAsync(BROKER_FILE, JSON.stringify(this.broker, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (e) {
      console.warn('Save broker local error:', e);
    }
  }

  // SÖZLEŞMELER (CONTRACTS)
  getContracts(): Contract[] {
    return this.contracts;
  }

  async addContract(contract: Contract) {
    this.contracts.unshift(contract);
    this.saveContractsLocal();
    this.notify();
    await syncContractToCloud(contract);
  }

  async deleteContract(id: string) {
    this.contracts = this.contracts.filter(c => c.id !== id);
    this.saveContractsLocal();
    this.notify();
    await deleteContractFromCloud(id);
  }

  // PORTFÖY (PROPERTIES)
  getProperties(): Property[] {
    return this.properties;
  }

  async addProperty(property: Property) {
    this.properties.unshift(property);
    this.savePropertiesLocal();
    this.notify();
    await syncPropertyToCloud(property);
  }

  async deleteProperty(id: string) {
    this.properties = this.properties.filter(p => p.id !== id);
    this.savePropertiesLocal();
    this.notify();
    await deletePropertyFromCloud(id);
  }

  // ALICI TALEPLERİ (DEMANDS)
  getDemands(): BuyerDemand[] {
    return this.demands;
  }

  async addDemand(demand: BuyerDemand) {
    this.demands.unshift(demand);
    this.saveDemandsLocal();
    this.notify();
    await syncDemandToCloud(demand);
  }

  async deleteDemand(id: string) {
    this.demands = this.demands.filter(d => d.id !== id);
    this.saveDemandsLocal();
    this.notify();
    await deleteDemandFromCloud(id);
  }

  // OFİS & BROKER PROFİLİ
  getBroker(): BrokerProfile {
    return this.broker;
  }

  async updateBroker(profile: Partial<BrokerProfile>) {
    this.broker = { ...this.broker, ...profile };
    this.saveBrokerLocal();
    this.notify();
    await syncBrokerToCloud(this.broker);
  }

  // GERÇEK ANALİTİK METRİKLERİ
  getAnalytics() {
    const totalContracts = this.contracts.length;
    const yerGostermeCount = this.contracts.filter(c => c.type === 'YER_GOSTERME').length;
    const yetkiCount = this.contracts.filter(c => c.type === 'YETKI_BELGESI').length;
    const kaporaCount = this.contracts.filter(c => c.type === 'KAPORA_TEKLIFFORMU').length;

    let potentialCommission = 0;
    this.contracts.forEach(c => {
      const priceNum = parseFloat(c.property?.price?.replace(/\./g, '')?.replace(/,/g, '') || '0') || 0;
      if (c.property?.type === 'SATILIK') {
        potentialCommission += priceNum * 0.02;
      } else {
        potentialCommission += priceNum;
      }
    });

    return {
      totalContracts,
      yerGostermeCount,
      yetkiCount,
      kaporaCount,
      totalProperties: this.properties.length,
      totalDemands: this.demands.length,
      potentialCommission: Math.round(potentialCommission)
    };
  }
}

export const store = new ContractStore();
