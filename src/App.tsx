import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import ShareSalesDialog from './components/ShareSalesDialog';
import SalesAuthDialog from './components/SalesAuthDialog';
import SalesAccountDialog from './components/SalesAccountDialog';
import PayoutSections from './components/PayoutSections';
import { DEFAULT_PACKAGES } from './data/incentives';
import { SaleItem, IncentivePackage } from './types/incentive';
import { getTier } from './utils/getTier';
import { calculateTotalIncentive, calculateTotalSA } from './utils/calculateIncentive';
import { generateSalesPdf } from './utils/generateSalesPdf';
import { savePackagesToSupabase, seedPackagesIfEmpty } from './services/packageStore';
import { isSupabaseConfigured } from './services/supabaseClient';
import {
  SalesProfile,
  fetchSalesProfile,
  getCurrentUser,
  onAuthChange,
  signInSales,
  signOutSales,
  signUpSales,
} from './services/authStore';
import { getPeriodId, loadSalesEntriesForPeriods, loadSalesEntry, saveSalesEntry } from './services/salesEntryStore';
import { calculateMonthlyPayout, calculateQuarterlyPayout, getQuarterPeriods } from './utils/payoutEngine';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

const PACKAGE_STORAGE_KEY = 'kalkulator-packages';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function loadStoredPackages() {
  try {
    const storedPackages = window.localStorage.getItem(PACKAGE_STORAGE_KEY);
    if (!storedPackages) return DEFAULT_PACKAGES;

    const parsed = JSON.parse(storedPackages) as IncentivePackage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PACKAGES;

    return parsed;
  } catch {
    window.localStorage.removeItem(PACKAGE_STORAGE_KEY);
    return DEFAULT_PACKAGES;
  }
}

function App() {
  const now = new Date();
  const hasLoadedRemotePackages = useRef(!isSupabaseConfigured);
  const [darkMode, setDarkMode] = useState(false);
  const [packages, setPackages] = useState<IncentivePackage[]>(loadStoredPackages);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showPackageManager, setShowPackageManager] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSalesAuth, setShowSalesAuth] = useState(false);
  const [showSalesAccount, setShowSalesAccount] = useState(false);
  const [salesUserId, setSalesUserId] = useState<string | null>(null);
  const [salesProfile, setSalesProfile] = useState<SalesProfile | null>(null);
  const [quarterSalesByPeriod, setQuarterSalesByPeriod] = useState<Record<string, SaleItem[]>>({});
  const [isSalesSyncing, setIsSalesSyncing] = useState(false);
  const [salesSyncMessage, setSalesSyncMessage] = useState('');
  const [pendingAdminAction, setPendingAdminAction] = useState<'packages' | 'reference' | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    [
      'kalkulator-dark-mode',
      'kalkulator-sales',
      'kalkulator-month',
      'kalkulator-year',
    ].forEach((key) => window.localStorage.removeItem(key));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    getCurrentUser().then((user) => {
      if (!cancelled) setSalesUserId(user?.id ?? null);
    });

    const unsubscribe = onAuthChange((user) => {
      setSalesUserId(user?.id ?? null);
      if (!user) {
        setSalesProfile(null);
        setSalesSyncMessage('');
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!salesUserId) return;

    let cancelled = false;
    fetchSalesProfile(salesUserId)
      .then((profile) => {
        if (!cancelled) setSalesProfile(profile);
      })
      .catch(() => {
        if (!cancelled) setSalesProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [salesUserId]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    seedPackagesIfEmpty(loadStoredPackages())
      .then((remotePackages) => {
        if (cancelled || !remotePackages || remotePackages.length === 0) return;
        setPackages(remotePackages);
        window.localStorage.setItem(PACKAGE_STORAGE_KEY, JSON.stringify(remotePackages));
      })
      .catch(() => {
        // Keep the local package cache usable if Supabase is temporarily unavailable.
      })
      .finally(() => {
        if (!cancelled) hasLoadedRemotePackages.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PACKAGE_STORAGE_KEY, JSON.stringify(packages));

    if (!isSupabaseConfigured || !hasLoadedRemotePackages.current) return;

    const saveTimer = window.setTimeout(() => {
      savePackagesToSupabase(packages).catch(() => {
        // Local cache remains the fallback when the network is offline.
      });
    }, 400);

    return () => window.clearTimeout(saveTimer);
  }, [packages]);

  const totalSA = calculateTotalSA(sales);
  const activeTier = getTier(totalSA);
  const totalIncentive = calculateTotalIncentive(sales, packages);
  const selectedPeriodId = getPeriodId(selectedYear, selectedMonth);
  const quarterPeriods = useMemo(() => getQuarterPeriods(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const currentQuarterSalesByPeriod = useMemo(
    () => ({
      ...quarterSalesByPeriod,
      [selectedPeriodId]: sales,
    }),
    [quarterSalesByPeriod, sales, selectedPeriodId],
  );
  const monthlyPayout = useMemo(() => calculateMonthlyPayout(sales, packages), [sales, packages]);
  const quarterlyPayout = useMemo(
    () => calculateQuarterlyPayout(selectedYear, selectedMonth, currentQuarterSalesByPeriod, packages),
    [currentQuarterSalesByPeriod, packages, selectedMonth, selectedYear],
  );

  const markSalesDraft = useCallback(() => {
    if (salesUserId) setSalesSyncMessage('Ada perubahan belum disimpan');
  }, [salesUserId]);

  const handleAddSale = useCallback((packageId: string, quantity: number) => {
    markSalesDraft();
    setSales((prev) => {
      const existing = prev.findIndex((s) => s.packageId === packageId);
      if (existing >= 0) {
        return prev.map((s, i) => i === existing ? { ...s, quantity: s.quantity + quantity } : s);
      }
      return [...prev, { id: generateId(), packageId, quantity }];
    });
  }, [markSalesDraft, setSales]);

  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    markSalesDraft();
    setSales((prev) => prev.map((s) => s.id === id ? { ...s, quantity } : s));
  }, [markSalesDraft, setSales]);

  const handleDelete = useCallback((id: string) => {
    markSalesDraft();
    setSales((prev) => prev.filter((s) => s.id !== id));
  }, [markSalesDraft, setSales]);

  const handleReset = () => {
    markSalesDraft();
    setSales([]);
    setShowResetConfirm(false);
  };

  const handleLoadSample = () => {
    markSalesDraft();
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

  useEffect(() => {
    if (!salesUserId) {
      setQuarterSalesByPeriod({});
      return;
    }

    let cancelled = false;
    const periodIds = quarterPeriods.map((period) => period.periodId);
    loadSalesEntriesForPeriods(salesUserId, periodIds)
      .then((entries) => {
        if (!cancelled) setQuarterSalesByPeriod(entries);
      })
      .catch(() => {
        if (!cancelled) setQuarterSalesByPeriod({});
      });

    return () => {
      cancelled = true;
    };
  }, [salesUserId, quarterPeriods]);

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

  const handleSharePdf = async (salespersonName: string, salesCode: string) => {
    const pdfBlob = generateSalesPdf({
      sales,
      packages,
      activeTier,
      totalSA,
      totalIncentive,
      selectedMonthName: MONTHS[selectedMonth - 1],
      selectedYear,
      salespersonName,
      salesCode,
      output: 'blob',
    });
    if (!pdfBlob) return;

    const safeName = salespersonName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sales';
    const file = new File([pdfBlob], `insentif-sales-${safeName}-${salesCode}.pdf`, { type: 'application/pdf' });
    const shareData = {
      title: 'Kalkulator Insentif Sales MyRepublic',
      text: `Estimasi insentif ${salespersonName} (${salesCode})`,
      files: [file],
    };
    const shareNavigator = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };

    const downloadSharedPdf = () => {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    };

    setShowShareDialog(false);
    if (shareNavigator.share && (!shareNavigator.canShare || shareNavigator.canShare(shareData))) {
      try {
        await shareNavigator.share(shareData);
        return;
      } catch {
        downloadSharedPdf();
        return;
      }
    }

    downloadSharedPdf();
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

  const handleSalesSignIn = async (email: string, password: string) => {
    const user = await signInSales(email, password);
    setSalesUserId(user?.id ?? null);
  };

  const handleSalesSignUp = async (email: string, password: string, name: string, salesCode: string) => {
    await signUpSales(email, password, name, salesCode);
  };

  const handleSalesSignOut = async () => {
    setIsSalesSyncing(true);
    try {
      await signOutSales();
      setSalesUserId(null);
      setSalesProfile(null);
      setSalesSyncMessage('');
      setQuarterSalesByPeriod({});
      setShowSalesAccount(false);
    } finally {
      setIsSalesSyncing(false);
    }
  };

  const handleSaveSalesEntry = async () => {
    if (!salesUserId) {
      setShowSalesAuth(true);
      return;
    }

    setIsSalesSyncing(true);
    try {
      await saveSalesEntry(salesUserId, selectedPeriodId, sales, packages);
      setQuarterSalesByPeriod((prev) => ({ ...prev, [selectedPeriodId]: sales }));
      setSalesSyncMessage(`Tersimpan untuk ${MONTHS[selectedMonth - 1]} ${selectedYear}`);
    } catch (error) {
      setSalesSyncMessage(error instanceof Error ? error.message : 'Gagal menyimpan data sales.');
    } finally {
      setIsSalesSyncing(false);
    }
  };

  const handleLoadSalesEntry = async () => {
    if (!salesUserId) {
      setShowSalesAuth(true);
      return;
    }

    setIsSalesSyncing(true);
    try {
      const entry = await loadSalesEntry(salesUserId, selectedPeriodId);
      if (!entry) {
        setSales([]);
        setSalesSyncMessage(`Belum ada data tersimpan untuk ${MONTHS[selectedMonth - 1]} ${selectedYear}`);
        return;
      }
      setSales(entry.sales);
      setQuarterSalesByPeriod((prev) => ({ ...prev, [selectedPeriodId]: entry.sales }));
      setSalesSyncMessage(`Data ${MONTHS[selectedMonth - 1]} ${selectedYear} dimuat`);
    } catch (error) {
      setSalesSyncMessage(error instanceof Error ? error.message : 'Gagal memuat data sales.');
    } finally {
      setIsSalesSyncing(false);
    }
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
        onSharePdf={() => setShowShareDialog(true)}
        onReset={() => setShowResetConfirm(true)}
        onLogoClick={() => requestAdminAccess('packages')}
        onSalesAccountClick={() => {
          if (salesUserId) setShowSalesAccount(true);
          else setShowSalesAuth(true);
        }}
        salesLoggedIn={Boolean(salesUserId)}
        salesLabel={salesProfile?.name || 'Akun Sales'}
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

        <PayoutSections monthly={monthlyPayout} quarterly={quarterlyPayout} />

        <IncentiveReference
          packages={packages}
          activeTier={activeTier}
        />
      </main>

      {/* Mobile and tablet bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex gap-3 lg:hidden print:hidden z-30">
        <button
          onClick={downloadPdf}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Simpan
        </button>
        <button
          onClick={() => setShowShareDialog(true)}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Bagikan
        </button>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
      <ShareSalesDialog
        isOpen={showShareDialog}
        onCancel={() => setShowShareDialog(false)}
        onSubmit={({ salespersonName, salesCode }) => {
          void handleSharePdf(salespersonName, salesCode);
        }}
      />
      <SalesAuthDialog
        isOpen={showSalesAuth}
        onCancel={() => setShowSalesAuth(false)}
        onSignIn={handleSalesSignIn}
        onSignUp={handleSalesSignUp}
      />
      <SalesAccountDialog
        isOpen={showSalesAccount}
        profile={salesProfile}
        isConfigured={isSupabaseConfigured}
        isSyncing={isSalesSyncing}
        lastSavedLabel={salesSyncMessage}
        onLogin={() => {
          setShowSalesAccount(false);
          setShowSalesAuth(true);
        }}
        onSave={handleSaveSalesEntry}
        onLoad={handleLoadSalesEntry}
        onSignOut={() => {
          void handleSalesSignOut();
        }}
        onClose={() => setShowSalesAccount(false)}
      />
    </div>
  );
}

export default App;
