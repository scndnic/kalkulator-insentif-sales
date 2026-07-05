import { CalendarDays, Layers3 } from 'lucide-react';
import { MonthlyPayout, QuarterlyPayout } from '../utils/payoutEngine';
import { formatCurrency } from '../utils/formatCurrency';

interface PayoutSectionsProps {
  monthly: MonthlyPayout;
  quarterly: QuarterlyPayout;
}

export default function PayoutSections({ monthly, quarterly }: PayoutSectionsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:grid-cols-2">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Bulanan</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Skema insentif bulan berjalan</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Insentif</p>
            <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(monthly.totalIncentive)}</p>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
            <p className="text-xs text-brand-600 dark:text-brand-300">Bulan Pertama 80%</p>
            <p className="mt-1 text-sm font-bold text-brand-700 dark:text-brand-200">{formatCurrency(monthly.firstMonthAmount)}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ditahan 20%</p>
            <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(monthly.deferredAmount)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Triwulan</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Q{quarterly.quarterNumber} · bulan ke-{quarterly.quarterMonthIndex} dalam triwulan
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Layers3 className="h-4 w-4" />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_1fr] bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-500 dark:bg-gray-950/40 dark:text-gray-400">
            <span>Periode</span>
            <span className="text-center">SA</span>
            <span className="text-center">Upress</span>
            <span className="text-right">Nominal</span>
          </div>
          {quarterly.rows.map((row) => (
            <div
              key={`${row.periodId}-${row.percentage}`}
              className="grid grid-cols-[1.4fr_0.7fr_0.8fr_1fr] items-center border-t border-gray-100 px-3 py-3 text-xs dark:border-gray-800"
            >
              <span className="font-medium text-gray-800 dark:text-gray-200">{row.label}</span>
              <span className="text-center text-gray-500 dark:text-gray-400">{row.totalSA} SA</span>
              <span className="text-center font-semibold text-emerald-700 dark:text-emerald-300">{row.percentage}%</span>
              <span className="text-right font-bold text-gray-900 dark:text-white">{formatCurrency(row.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-gray-950/40">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Upress Terjadwal</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(quarterly.totalAmount)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
