import { Trash2, Plus, Minus } from 'lucide-react';
import { SaleItem, IncentivePackage, IncentiveTier } from '../types/incentive';
import { getTierLabel } from '../utils/getTier';
import { formatCurrency } from '../utils/formatCurrency';

interface SalesTableProps {
  sales: SaleItem[];
  packages: IncentivePackage[];
  activeTier: IncentiveTier;
  totalIncentive: number;
  totalSA: number;
  onQuantityChange: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
}

export default function SalesTable({
  sales,
  packages,
  activeTier,
  totalIncentive,
  totalSA,
  onQuantityChange,
  onDelete,
}: SalesTableProps) {
  const getPackage = (pkgId: string) => packages.find((p) => p.id === pkgId);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Rincian Penjualan</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
          {sales.length} item · {totalSA} SA
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <th className="text-left px-6 py-3 font-medium">No.</th>
              <th className="text-left px-6 py-3 font-medium">Paket</th>
              <th className="text-right px-6 py-3 font-medium">Harga Produk</th>
              <th className="text-center px-6 py-3 font-medium">Jumlah SA</th>
              <th className="text-center px-6 py-3 font-medium">Tier Aktif</th>
              <th className="text-right px-6 py-3 font-medium">Insentif / SA</th>
              <th className="text-right px-6 py-3 font-medium">Subtotal</th>
              <th className="text-center px-6 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {sales.map((item, idx) => {
              const pkg = getPackage(item.packageId);
              if (!pkg) return null;
              const incentivePerSA = pkg[activeTier];
              const subtotal = incentivePerSA * item.quantity;
              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{pkg.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{formatCurrency(pkg.productPrice)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => item.quantity > 1 && onQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v >= 1) onQuantityChange(item.id, v);
                        }}
                        className="w-14 text-center border border-gray-200 dark:border-gray-700 rounded-lg py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                      {getTierLabel(activeTier)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">{formatCurrency(incentivePerSA)}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">{formatCurrency(subtotal)}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Total</td>
              <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">{totalSA} SA</td>
              <td colSpan={2} />
              <td className="px-6 py-4 text-right text-base font-bold text-brand-700 dark:text-brand-400">{formatCurrency(totalIncentive)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {sales.map((item, idx) => {
          const pkg = getPackage(item.packageId);
          if (!pkg) return null;
          const incentivePerSA = pkg[activeTier];
          const subtotal = incentivePerSA * item.quantity;
          return (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">#{idx + 1}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{pkg.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(pkg.productPrice)}</p>
                </div>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => item.quantity > 1 && onQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center disabled:opacity-40 active:bg-gray-200"
                  >
                    <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <span className="w-10 text-center font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:bg-gray-200"
                  >
                    <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">× {formatCurrency(incentivePerSA)}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(subtotal)}</p>
                  <span className="text-xs text-brand-600 dark:text-brand-400">{getTierLabel(activeTier)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Total ({totalSA} SA)</span>
          <span className="text-base font-bold text-brand-700 dark:text-brand-400">{formatCurrency(totalIncentive)}</span>
        </div>
      </div>
    </div>
  );
}
