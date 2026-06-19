import { TrendingUp, Layers, DollarSign, BarChart2 } from 'lucide-react';
import { IncentiveTier } from '../types/incentive';
import { getTierLabel } from '../utils/getTier';
import { formatCurrency } from '../utils/formatCurrency';

const TIER_COLORS: Record<IncentiveTier, string> = {
  tier0To5: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  tier6To10: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  tier11To14: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  tier15Plus: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800',
};

interface SummaryCardsProps {
  totalSA: number;
  activeTier: IncentiveTier;
  totalIncentive: number;
}

export default function SummaryCards({ totalSA, activeTier, totalIncentive }: SummaryCardsProps) {
  const avgPerSA = totalSA > 0 ? totalIncentive / totalSA : 0;

  const cards = [
    {
      label: 'Total SA PAID',
      value: `${totalSA} SA`,
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Tier Aktif',
      value: getTierLabel(activeTier),
      icon: Layers,
      color: 'from-brand-500 to-brand-600',
      bg: TIER_COLORS[activeTier],
      iconColor: '',
      tierCard: true,
      tier: activeTier,
    },
    {
      label: 'Total Insentif',
      value: formatCurrency(totalIncentive),
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Rata-rata / SA',
      value: formatCurrency(avgPerSA),
      icon: BarChart2,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl p-4 sm:p-5 border ${card.tierCard ? card.bg : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'} shadow-sm`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
            <div className={`w-8 h-8 rounded-lg ${card.tierCard ? '' : card.bg} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.tierCard ? '' : card.iconColor}`} />
            </div>
          </div>
          <p className={`text-lg sm:text-xl font-bold truncate ${card.tierCard ? '' : 'text-gray-900 dark:text-white'}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
