import { DollarSign, Layers, TrendingUp, Trophy, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface SummaryCardsProps {
  currentMonthSA: number;
  quarterSA: number;
  totalIncentive: number;
  totalUpress: number;
  totalIncome: number;
}

export default function SummaryCards({
  currentMonthSA,
  quarterSA,
  totalIncentive,
  totalUpress,
  totalIncome,
}: SummaryCardsProps) {
  const cards = [
    {
      label: 'SA Paid Bulan Ini',
      value: `${currentMonthSA} SA`,
      icon: TrendingUp,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total SA Triwulan',
      value: `${quarterSA} SA`,
      icon: Layers,
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Total Insentif',
      value: formatCurrency(totalIncentive),
      icon: DollarSign,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Upress',
      value: formatCurrency(totalUpress),
      icon: Trophy,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Total Pendapatan',
      value: formatCurrency(totalIncome),
      icon: Wallet,
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      iconColor: 'text-brand-600 dark:text-brand-400',
      featured: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
            card.featured
              ? 'col-span-2 border-brand-100 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20 lg:col-span-1'
              : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </div>
          <p className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
