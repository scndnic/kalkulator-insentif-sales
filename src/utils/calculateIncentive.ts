import { SaleItem, IncentivePackage } from '../types/incentive';
import { getTier } from './getTier';

export function calculateTotalIncentive(
  sales: SaleItem[],
  packages: IncentivePackage[]
): number {
  const totalSA = sales.reduce((total, item) => total + item.quantity, 0);
  const activeTier = getTier(totalSA);

  return sales.reduce((total, item) => {
    const selectedPackage = packages.find((pkg) => pkg.id === item.packageId);
    if (!selectedPackage) return total;
    const incentivePerSA = selectedPackage[activeTier];
    return total + incentivePerSA * item.quantity;
  }, 0);
}

export function calculateTotalSA(sales: SaleItem[]): number {
  return sales.reduce((total, item) => total + item.quantity, 0);
}
