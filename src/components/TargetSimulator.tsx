import { useState } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { IncentivePackage, SaleItem } from '../types/incentive';
import { getTier, getTierLabel, getNextTierInfo } from '../utils/getTier';
import { calculateTotalIncentive, calculateTotalSA } from '../utils/calculateIncentive';
import { formatCurrency } from '../utils/formatCurrency';
import CustomSelect from './CustomSelect';
import { calculatePriceWithPpn } from '../utils/pricing';

interface TargetSimulatorProps {
  sales: SaleItem[];
  packages: IncentivePackage[];
  totalSA: number;
  totalIncentive: number;
}

interface SimItem {
  packageId: string;
  quantity: number;
}

export default function TargetSimulator({ sales, packages, totalSA, totalIncentive }: TargetSimulatorProps) {
  const [simItems, setSimItems] = useState<SimItem[]>([]);
  const [simPackageId, setSimPackageId] = useState('');
  const [simQty, setSimQty] = useState<number | ''>(1);

  const { nextTier, saNeeded, nextTierLabel } = getNextTierInfo(totalSA);
  const activeTier = getTier(totalSA);
  const packageOptions = [
    { value: '', label: '-- Pilih paket simulasi --' },
    ...packages.map((pkg) => ({
      value: pkg.id,
      label: pkg.name,
      rightLabel: formatCurrency(calculatePriceWithPpn(pkg.productPrice)),
    })),
  ];

  const addSimItem = () => {
    if (!simPackageId || !simQty || Number(simQty) < 1) return;
    const existing = simItems.findIndex((s) => s.packageId === simPackageId);
    if (existing >= 0) {
      const updated = [...simItems];
      updated[existing].quantity += Number(simQty);
      setSimItems(updated);
    } else {
      setSimItems([...simItems, { packageId: simPackageId, quantity: Number(simQty) }]);
    }
    setSimPackageId('');
    setSimQty(1);
  };

  const removeSimItem = (idx: number) => {
    setSimItems(simItems.filter((_, i) => i !== idx));
  };

  const simSaleItems: SaleItem[] = simItems.map((s, i) => ({ id: `sim-${i}`, packageId: s.packageId, quantity: s.quantity }));
  const combinedSales: SaleItem[] = [
    ...sales,
    ...simSaleItems.map((s) => ({ ...s, id: `combined-${s.id}` })),
  ];

  const simTotalSA = calculateTotalSA(simSaleItems);
  const newTotalSA = totalSA + simTotalSA;
  const newTier = getTier(newTotalSA);
  const newTotalIncentive = calculateTotalIncentive(combinedSales, packages);
  const diff = newTotalIncentive - totalIncentive;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-amber-500" />
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Simulasi Tambahan Penjualan</h2>
      </div>

      {/* Current status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">SA saat ini</p>
          <p className="font-bold text-gray-900 dark:text-white">{totalSA} SA</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tier saat ini</p>
          <p className="font-bold text-gray-900 dark:text-white">{getTierLabel(activeTier)}</p>
        </div>
        {nextTier && (
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-amber-600 dark:text-amber-400">Butuh untuk naik tier</p>
            <p className="font-bold text-amber-700 dark:text-amber-300">{saNeeded} SA lagi → {nextTierLabel}</p>
          </div>
        )}
        {!nextTier && (
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-brand-600 dark:text-brand-400">Status</p>
            <p className="font-bold text-brand-700 dark:text-brand-300">Tier Tertinggi 🏆</p>
          </div>
        )}
      </div>

      {/* Sim input */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <CustomSelect
          value={simPackageId}
          options={packageOptions}
          onChange={setSimPackageId}
          placeholder="-- Pilih paket simulasi --"
          className="flex-1"
        />
        <input
          type="number"
          min={1}
          value={simQty}
          onChange={(e) => setSimQty(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full sm:w-24 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={addSimItem}
          className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Simulasi
        </button>
      </div>

      {simItems.length > 0 && (
        <>
          <div className="space-y-2 mb-4">
            {simItems.map((s, i) => {
              const pkg = packages.find((p) => p.id === s.packageId);
              return (
                <div key={i} className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{pkg?.name} × {s.quantity} SA</span>
                  <button onClick={() => removeSimItem(i)} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Sim result */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3 uppercase tracking-wide">Hasil Simulasi</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total SA baru</p>
                <p className="font-bold text-gray-900 dark:text-white">{newTotalSA} SA</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tier baru</p>
                <p className="font-bold text-gray-900 dark:text-white">{getTierLabel(newTier)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Insentif sekarang</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(totalIncentive)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Insentif setelah simulasi</p>
                <p className="font-bold text-amber-700 dark:text-amber-300">{formatCurrency(newTotalIncentive)}</p>
              </div>
            </div>
            {diff > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  + {formatCurrency(diff)} potensi kenaikan insentif
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {simItems.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          Tambahkan paket simulasi untuk melihat potensi kenaikan insentif
        </p>
      )}
    </div>
  );
}
