import { IncentivePackage, SaleItem, UpressRate, UpressTierKey } from '../types/incentive';
import { calculateTotalIncentive, calculateTotalSA } from './calculateIncentive';

export interface PeriodMarker {
  year: number;
  month: number;
  periodId: string;
  label: string;
}

export interface MonthlyPayout {
  totalSA: number;
  totalIncentive: number;
  firstMonthAmount: number;
  deferredAmount: number;
  deferredSourceAmount: number;
  deferredSourcePeriod: PeriodMarker;
  monthlyIncome: number;
}

export interface QuarterlyPayoutRow {
  periodId: string;
  label: string;
  percentage: number;
  totalSA: number;
  baseAmount: number;
  amount: number;
  tierLabel: string;
}

export interface QuarterlyPayout {
  quarterNumber: number;
  quarterMonthIndex: number;
  periods: PeriodMarker[];
  rows: QuarterlyPayoutRow[];
  totalAmount: number;
  totalQuarterSA: number;
  totalQuarterUpressBase: number;
}

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

function periodId(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function shiftPeriod(year: number, month: number, offsetMonths: number): PeriodMarker {
  const date = new Date(year, month - 1 + offsetMonths, 1);
  const shiftedYear = date.getFullYear();
  const shiftedMonth = date.getMonth() + 1;

  return {
    year: shiftedYear,
    month: shiftedMonth,
    periodId: periodId(shiftedYear, shiftedMonth),
    label: `${MONTHS[shiftedMonth - 1]} ${shiftedYear}`,
  };
}

export function getQuarterMonthIndex(month: number) {
  return ((month - 1) % 3) + 1;
}

export function getQuarterPeriods(year: number, month: number): PeriodMarker[] {
  const startMonth = Math.floor((month - 1) / 3) * 3 + 1;

  return [0, 1, 2].map((offset) => {
    const periodMonth = startMonth + offset;
    return {
      year,
      month: periodMonth,
      periodId: periodId(year, periodMonth),
      label: `${MONTHS[periodMonth - 1]} ${year}`,
    };
  });
}

export function calculateMonthlyPayout(
  sales: SaleItem[],
  packages: IncentivePackage[],
  firstMonthPercentage = 80,
  deferredSourceSales: SaleItem[] = [],
  year?: number,
  month?: number,
): MonthlyPayout {
  const totalIncentive = calculateTotalIncentive(sales, packages);
  const firstMonthAmount = Math.round(totalIncentive * (firstMonthPercentage / 100));
  const deferredSourceAmount = Math.round(calculateTotalIncentive(deferredSourceSales, packages) * 0.2);
  const deferredSourcePeriod = year && month ? shiftPeriod(year, month, -2) : shiftPeriod(new Date().getFullYear(), new Date().getMonth() + 1, -2);

  return {
    totalSA: calculateTotalSA(sales),
    totalIncentive,
    firstMonthAmount,
    deferredAmount: totalIncentive - firstMonthAmount,
    deferredSourceAmount,
    deferredSourcePeriod,
    monthlyIncome: firstMonthAmount + deferredSourceAmount,
  };
}

function getUpressSchedule(quarterMonthIndex: number) {
  if (quarterMonthIndex === 1) return [{ sourceIndex: 0, percentage: 50 }];
  if (quarterMonthIndex === 2) return [{ sourceIndex: 1, percentage: 50 }];

  return [
    { sourceIndex: 0, percentage: 50 },
    { sourceIndex: 1, percentage: 50 },
    { sourceIndex: 2, percentage: 100 },
  ];
}

function getUpressTier(totalSA: number): { key: UpressTierKey | null; label: string } {
  if (totalSA >= 25) return { key: 'tier25', label: '25 SA' };
  if (totalSA >= 20) return { key: 'tier20', label: '20 SA' };
  if (totalSA >= 15) return { key: 'tier15', label: '15 SA' };
  if (totalSA >= 10) return { key: 'tier10', label: '10 SA' };
  return { key: null, label: '<10 SA' };
}

export function calculateUpressBase(
  sales: SaleItem[],
  upressRates: UpressRate[],
): { amount: number; tierLabel: string; totalSA: number } {
  const totalSA = calculateTotalSA(sales);
  const tier = getUpressTier(totalSA);
  if (!tier.key) return { amount: 0, tierLabel: tier.label, totalSA };

  const ratesByPackage = new Map(upressRates.map((rate) => [rate.packageId, rate]));
  const amount = sales.reduce((total, item) => {
    const rate = ratesByPackage.get(item.packageId);
    return total + (rate?.[tier.key as UpressTierKey] ?? 0) * item.quantity;
  }, 0);

  return { amount, tierLabel: tier.label, totalSA };
}

export function calculateQuarterlyPayout(
  year: number,
  month: number,
  salesByPeriod: Record<string, SaleItem[]>,
  upressRates: UpressRate[],
): QuarterlyPayout {
  const periods = getQuarterPeriods(year, month);
  const quarterMonthIndex = getQuarterMonthIndex(month);
  const rows = getUpressSchedule(quarterMonthIndex).map(({ sourceIndex, percentage }) => {
    const source = periods[sourceIndex];
    const sourceSales = salesByPeriod[source.periodId] ?? [];
    const upressBase = calculateUpressBase(sourceSales, upressRates);
    const baseAmount = upressBase.amount;
    const amount = Math.round(baseAmount * (percentage / 100));

    return {
      periodId: source.periodId,
      label: source.label,
      percentage,
      totalSA: upressBase.totalSA,
      baseAmount,
      amount,
      tierLabel: upressBase.tierLabel,
    };
  });
  const totalQuarterSA = periods.reduce((total, period) => total + calculateTotalSA(salesByPeriod[period.periodId] ?? []), 0);
  const totalQuarterUpressBase = periods.reduce((total, period) => total + calculateUpressBase(salesByPeriod[period.periodId] ?? [], upressRates).amount, 0);

  return {
    quarterNumber: Math.ceil(month / 3),
    quarterMonthIndex,
    periods,
    rows,
    totalAmount: rows.reduce((total, row) => total + row.amount, 0),
    totalQuarterSA,
    totalQuarterUpressBase,
  };
}
