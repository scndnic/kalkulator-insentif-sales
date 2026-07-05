export type IncentiveTier = 'tier0To5' | 'tier6To10' | 'tier11To14' | 'tier15Plus';

export interface IncentivePackage {
  id: string;
  name: string;
  productPrice: number;
  tier0To5: number;
  tier6To10: number;
  tier11To14: number;
  tier15Plus: number;
}

export interface SaleItem {
  id: string;
  packageId: string;
  quantity: number;
}

export interface SimulationItem {
  packageId: string;
  quantity: number;
}

export interface UpressRate {
  packageId: string;
  tier10: number;
  tier15: number;
  tier20: number;
  tier25: number;
}

export type UpressTierKey = 'tier10' | 'tier15' | 'tier20' | 'tier25';
