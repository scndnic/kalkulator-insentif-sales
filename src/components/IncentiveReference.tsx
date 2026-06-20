import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { IncentivePackage, IncentiveTier } from '../types/incentive';
import { getTierLabel } from '../utils/getTier';
import { formatCurrency } from '../utils/formatCurrency';
import CustomSelect from './CustomSelect';
import { calculatePriceWithPpn } from '../utils/pricing';

interface IncentiveReferenceProps {
  packages: IncentivePackage[];
  activeTier: IncentiveTier;
}

const TIERS: IncentiveTier[] = ['tier0To5', 'tier6To10', 'tier11To14', 'tier15Plus'];

export default function IncentiveReference({ packages, activeTier }: IncentiveReferenceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<IncentiveTier | 'all'>('all');

  const filtered = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(search.toLowerCase())
  );
  const tierOptions = [
    { value: 'all', label: 'Semua Tier' },
    ...TIERS.map((tier) => ({ value: tier, label: getTierLabel(tier) })),
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden print:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="text-left">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Tabel Referensi Insentif</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Data read-only. Harga PPN dihitung dengan PPN 11%.</p>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isOpen && (
        <div>
          <div className="px-4 sm:px-6 pb-4 flex flex-col sm:flex-row gap-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama paket..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <CustomSelect
              value={filterTier}
              options={tierOptions}
              onChange={(nextValue) => setFilterTier(nextValue as IncentiveTier | 'all')}
              className="w-full sm:w-44"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Paket</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Harga Produk</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Setelah PPN 11%</th>
                  {TIERS.filter((t) => filterTier === 'all' || t === filterTier).map((t) => (
                    <th
                      key={t}
                      className={`text-right px-4 py-3 text-xs font-semibold whitespace-nowrap ${
                        t === activeTier
                          ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {getTierLabel(t)}
                      {t === activeTier && <span className="ml-1">★</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 sm:px-6 py-2.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">{pkg.name}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatCurrency(pkg.productPrice)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(calculatePriceWithPpn(pkg.productPrice))}</td>
                    {TIERS.filter((t) => filterTier === 'all' || t === filterTier).map((t) => (
                      <td
                        key={t}
                        className={`px-4 py-2.5 text-right whitespace-nowrap ${
                          t === activeTier
                            ? 'bg-brand-50 dark:bg-brand-900/20 font-semibold text-brand-700 dark:text-brand-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {formatCurrency(pkg[t])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">
                Tidak ada paket yang cocok.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
