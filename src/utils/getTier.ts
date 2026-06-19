import { IncentiveTier } from '../types/incentive';

export function getTier(totalSA: number): IncentiveTier {
  if (totalSA <= 5) return 'tier0To5';
  if (totalSA <= 10) return 'tier6To10';
  if (totalSA <= 14) return 'tier11To14';
  return 'tier15Plus';
}

export function getTierLabel(tier: IncentiveTier): string {
  switch (tier) {
    case 'tier0To5': return '0–5 SA';
    case 'tier6To10': return '6–10 SA';
    case 'tier11To14': return '11–14 SA';
    case 'tier15Plus': return '≥15 SA';
  }
}

export function getNextTierInfo(totalSA: number): { nextTier: IncentiveTier | null; saNeeded: number; nextTierLabel: string } {
  if (totalSA <= 5) return { nextTier: 'tier6To10', saNeeded: 6 - totalSA, nextTierLabel: '6–10 SA' };
  if (totalSA <= 10) return { nextTier: 'tier11To14', saNeeded: 11 - totalSA, nextTierLabel: '11–14 SA' };
  if (totalSA <= 14) return { nextTier: 'tier15Plus', saNeeded: 15 - totalSA, nextTierLabel: '≥15 SA' };
  return { nextTier: null, saNeeded: 0, nextTierLabel: 'Tier tertinggi' };
}
