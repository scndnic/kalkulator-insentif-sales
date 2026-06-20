import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import AddSaleForm from './components/AddSaleForm';
import SalesTable from './components/SalesTable';
import EmptyState from './components/EmptyState';
import PaymentBreakdown from './components/PaymentBreakdown';
import TargetSimulator from './components/TargetSimulator';
import IncentiveReference from './components/IncentiveReference';
import PackageManager from './components/PackageManager';
import ConfirmDialog from './components/ConfirmDialog';
import AdminLoginDialog from './components/AdminLoginDialog';
import { DEFAULT_PACKAGES } from './data/incentives';
import { SaleItem, IncentivePackage } from './types/incentive';
import { getTier } from './utils/getTier';
import { calculateTotalIncentive, calculateTotalSA } from './utils/calculateIncentive';
import { generateSalesPdf } from './utils/generateSalesPdf';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function App() {
  const now = new Date();
  const [darkMode, setDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [packages, setPackages] = useState<IncentivePackage[]>(DEFAULT_PACKAGES);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showPackageManager, setShowPackageManager] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<'packages' | 'reference' | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    [
      'kalkulator-dark-mode',
      'kalkulator-packages',
      'kalkulator-sales',
      'kalkulator-month',
      'kalkulator-year',
    ].forEach((key) => window.localStorage.removeItem(key));
  }, []);

  const totalSA = calculateTotalSA(sales);
  const activeTier = getTier(totalSA);
  const totalIncentive = calculateTotalIncentive(sales, packages);

  const handleAddSale = useCallback((packageId: string, quantity: number) => {
    setSales((prev) => {
      const existing = prev.findIndex((s) => s.packageId === packageId);
      if (existing >= 0) {
        return prev.map((s, i) => i === existing ? { ...s, quantity: s.quantity + quantity } : s);
      }
      return [...prev, { id: generateId(), packageId, quantity }];
    });
  }, [setSales]);

  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setSales((prev) => prev.map((s) => s.id === id ? { ...s, quantity } : s));
  }, [setSales]);

  const handleDelete = useCallback((id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  }, [setSales]);

  const handleReset = () => {
    setSales([]);
    setShowResetConfirm(false);
  };

  const handleLoadSample = () => {
    const sampleSales: SaleItem[] = [];
    const jet20 = packages.find((p) => p.id === 'jet20');
    const neo100 = packages.find((p) => p.id === 'neo100');
    const nexus300 = packages.find((p) => p.id === 'nexus300');
    if (jet20) sampleSales.push({ id: generateId(), packageId: jet20.id, quantity: 3 });
    if (neo100) sampleSales.push({ id: generateId(), packageId: neo100.id, quantity: 5 });
    if (nexus300) sampleSales.push({ id: generateId(), packageId: nexus300.id, quantity: 5 });
    setSales(sampleSales);
  };

  const usedPackageIds = sales.map((s) => s.packageId);

  const scrollToForm = () => {
    document.getElementById('add-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const downloadPdf = () => {
    generateSalesPdf({
      sales,
      packages,
      activeTier,
      totalSA,
      totalIncentive,
      selectedMonthName: MONTHS[selectedMonth - 1],
      selectedYear,
    });
  };

  const requestAdminAccess = (action: 'packages' | 'reference') => {
    if (isAdminUnlocked) {
      if (action === 'packages') setShowPackageManager(true);
      return;
    }
    setPendingAdminAction(action);
    setShowAdminLogin(true);
  };

  const handleAdminSuccess = () => {
    setIsAdminUnlocked(true);
    setShowAdminLogin(false);
    if (pendingAdminAction === 'packages') setShowPackageManager(true);
    setPendingAdminAction(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <Header
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        darkMode={darkMode}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onDownloadPdf={downloadPdf}
        onReset={() => setShowResetConfirm(true)}
        onLogoClick={() => requestAdminAccess('packages')}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6 pb-24 lg:pb-6">
        {/* Period info */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hitung estimasi insentif berdasarkan jumlah SA PAID dan paket yang terjual.</p>
          </div>
        </div>

        <SummaryCards totalSA={totalSA} activeTier={activeTier} totalIncentive={totalIncentive} />

        <div id="add-form">
          <AddSaleForm packages={packages} onAdd={handleAddSale} onLoadSample={handleLoadSample} />
        </div>

        {sales.length === 0 ? (
          <EmptyState onAdd={scrollToForm} />
        ) : (
          <SalesTable
            sales={sales}
            packages={packages}
            activeTier={activeTier}
            totalIncentive={totalIncentive}
            totalSA={totalSA}
            onQuantityChange={handleQuantityChange}
            onDelete={handleDelete}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 print:grid-cols-2">
          <PaymentBreakdown totalIncentive={totalIncentive} />
          <TargetSimulator sales={sales} packages={packages} totalSA={totalSA} totalIncentive={totalIncentive} />
        </div>

        <IncentiveReference
          packages={packages}
          activeTier={activeTier}
          isAdminUnlocked={isAdminUnlocked}
        />
      </main>

      {/* Mobile and tablet bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex gap-3 lg:hidden print:hidden z-30">
        <button
          onClick={scrollToForm}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          + Tambah
        </button>
        <button
          onClick={downloadPdf}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
        >
          Simpan
        </button>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
        >
          Reset
        </button>
      </div>

      {showPackageManager && (
        <PackageManager
          packages={packages}
          onUpdate={setPackages}
          onClose={() => setShowPackageManager(false)}
          usedPackageIds={usedPackageIds}
        />
      )}

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Perhitungan?"
        message="Semua data penjualan sesi ini akan dihapus. Data juga otomatis kosong lagi saat halaman direfresh."
        confirmLabel="Ya, Reset"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        danger
      />
      <AdminLoginDialog
        isOpen={showAdminLogin}
        onSuccess={handleAdminSuccess}
        onCancel={() => {
          setShowAdminLogin(false);
          setPendingAdminAction(null);
        }}
      />
    </div>
  );
}

export default App;
