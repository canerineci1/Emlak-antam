import { Property, BuyerDemand, MatchResult } from '../types';

export function matchPropertyWithDemands(property: Property, demands: BuyerDemand[]): MatchResult[] {
  const propPriceNum = parseFloat(property.price.replace(/\./g, '').replace(/,/g, '')) || 0;

  const results: MatchResult[] = [];

  for (const demand of demands) {
    let score = 0;
    const reasons: string[] = [];

    // 1. İşlem Türü (Satılık / Kiralık)
    if (demand.type === property.type) {
      score += 35;
      reasons.push(`İşlem türü eşleşti (${property.type})`);
    }

    // 2. İlçe Eşleşmesi
    if (demand.targetDistrict.toLowerCase() === property.district.toLowerCase()) {
      score += 35;
      reasons.push(`Lokasyon eşleşti (${property.district})`);
    } else if (demand.targetCity.toLowerCase() === property.city.toLowerCase()) {
      score += 15;
      reasons.push(`Şehir eşleşti (${property.city})`);
    }

    // 3. Bütçe Uyumu
    if (demand.maxBudget > 0 && propPriceNum > 0) {
      if (propPriceNum <= demand.maxBudget) {
        score += 20;
        reasons.push(`Bütçe sınırları içinde (${demand.maxBudget.toLocaleString('tr-TR')} TL)`);
      } else if (propPriceNum <= demand.maxBudget * 1.15) {
        score += 10;
        reasons.push(`Bütçeye %15 yakınlıkta`);
      }
    } else {
      score += 15;
    }

    // 4. Oda Sayısı
    if (demand.preferredRooms && property.rooms && demand.preferredRooms === property.rooms) {
      score += 10;
      reasons.push(`Oda sayısı tam uyumlu (${property.rooms})`);
    }

    if (score >= 50) {
      results.push({
        demand,
        matchScore: Math.min(score, 100),
        matchReasons: reasons,
      });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}
