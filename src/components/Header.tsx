import { Calculator, Moon, Sun, Download, RotateCcw, Settings } from 'lucide-react';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

interface HeaderProps {
  selectedMonth: number;
  selectedYear: number;
  darkMode: boolean;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onToggleDarkMode: () => void;
  onDownloadPdf: () => void;
  onReset: () => void;
  onManagePackages: () => void;
}

export default function Header({
  selectedMonth,
  selectedYear,
  darkMode,
  onMonthChange,
  onYearChange,
  onToggleDarkMode,
  onDownloadPdf,
  onReset,
  onManagePackages,
}: HeaderProps) {
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-200 dark:shadow-brand-900">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 hidden lg:block">
              <h1 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                Kalkulator Insentif Sales MyRepublic
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-medium hidden sm:inline-flex">
                  Estimasi
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline-flex">
                  Sesi sementara
                </span>
              </div>
            </div>
          </div>

          {/* Period + Actions */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={onManagePackages}
                title="Kelola Paket"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onDownloadPdf}
                title="Download PDF"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onReset}
                title="Reset"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleDarkMode}
                title="Toggle dark mode"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
