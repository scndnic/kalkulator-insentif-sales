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
