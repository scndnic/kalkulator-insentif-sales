import { IncentivePackage, SaleItem } from '../types/incentive';
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
}

export interface QuarterlyPayoutRow {
  periodId: string;
  label: string;
  percentage: number;
  totalSA: number;
  baseAmount: number;
  amount: number;
}

export interface QuarterlyPayout {
  quarterNumber: number;
  quarterMonthIndex: number;
  periods: PeriodMarker[];
  rows: QuarterlyPayoutRow[];
  totalAmount: number;
}

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

function periodId(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
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
): MonthlyPayout {
  const totalIncentive = calculateTotalIncentive(sales, packages);
  const firstMonthAmount = Math.round(totalIncentive * (firstMonthPercentage / 100));

  return {
    totalSA: calculateTotalSA(sales),
    totalIncentive,
    firstMonthAmount,
    deferredAmount: totalIncentive - firstMonthAmount,
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

export function calculateQuarterlyPayout(
  year: number,
  month: number,
  salesByPeriod: Record<string, SaleItem[]>,
  packages: IncentivePackage[],
): QuarterlyPayout {
  const periods = getQuarterPeriods(year, month);
  const quarterMonthIndex = getQuarterMonthIndex(month);
  const rows = getUpressSchedule(quarterMonthIndex).map(({ sourceIndex, percentage }) => {
    const source = periods[sourceIndex];
    const sourceSales = salesByPeriod[source.periodId] ?? [];
    const baseAmount = calculateTotalIncentive(sourceSales, packages);
    const amount = Math.round(baseAmount * (percentage / 100));

    return {
      periodId: source.periodId,
      label: source.label,
      percentage,
      totalSA: calculateTotalSA(sourceSales),
      baseAmount,
      amount,
    };
  });

  return {
    quarterNumber: Math.ceil(month / 3),
    quarterMonthIndex,
    periods,
    rows,
    totalAmount: rows.reduce((total, row) => total + row.amount, 0),
  };
}
