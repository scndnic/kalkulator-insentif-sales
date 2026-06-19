import { formatCurrency } from '../utils/formatCurrency';

interface PaymentBreakdownProps {
  totalIncentive: number;
}

export default function PaymentBreakdown({ totalIncentive }: PaymentBreakdownProps) {
  const pay80 = Math.round(totalIncentive * 0.8);
  const pay20 = Math.round(totalIncentive * 0.2);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sm:p-6">
      <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-4">Skema Pembayaran 80/20</h2>

      {/* Visual bar */}
      <div className="mb-5">
        <div className="flex rounded-full overflow-hidden h-4 bg-gray-100 dark:bg-gray-800">
          <div
            className="bg-brand-600 transition-all duration-500"
            style={{ width: '80%' }}
          />
          <div
            className="bg-brand-200 dark:bg-brand-800 transition-all duration-500"
            style={{ width: '20%' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">80% — Bulan ke-1</span>
          <span className="text-xs text-brand-400 dark:text-brand-600 font-medium">20% — Bulan ke-3</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800">
          <div>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Dibayarkan Bulan Pertama</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">80% dari total insentif</p>
          </div>
          <p className="text-base font-bold text-brand-700 dark:text-brand-300">{formatCurrency(pay80)}</p>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Dibayarkan Bulan Ketiga</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">20% dari total insentif</p>
          </div>
          <p className="text-base font-bold text-gray-700 dark:text-gray-300">{formatCurrency(pay20)}</p>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 dark:bg-white border border-gray-800 dark:border-gray-200">
          <p className="text-xs font-semibold text-white dark:text-gray-900">Total Insentif (100%)</p>
          <p className="text-base font-bold text-white dark:text-gray-900">{formatCurrency(totalIncentive)}</p>
        </div>
      </div>
    </div>
  );
}
