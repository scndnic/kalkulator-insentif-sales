import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import AddSaleForm from './components/AddSaleForm';
import SalesTable from './components/SalesTable';
import EmptyState from './components/EmptyState';
import TargetSimulator from './components/TargetSimulator';
import IncentiveReference from './components/IncentiveReference';
import PackageManager from './components/PackageManager';
import ConfirmDialog from './components/ConfirmDialog';
import AdminLoginDialog from './components/AdminLoginDialog';
import ShareSalesDialog from './components/ShareSalesDialog';
import SalesAuthDialog from './components/SalesAuthDialog';
import SalesAccountDialog from './components/SalesAccountDialog';
import PayoutSections from './components/PayoutSections';
import Toast from './components/Toast';
import { DEFAULT_PACKAGES, DEFAULT_UPRESS_RATES } from './data/incentives';
import { SaleItem, IncentivePackage, UpressRate } from './types/incentive';
import { getTier } from './utils/getTier';
import { calculateTotalIncentive, calculateTotalSA } from './utils/calculateIncentive';
import { generateSalesPdf } from './utils/generateSalesPdf';
import { formatCurrency } from './utils/formatCurrency';
import { savePackagesToSupabase, seedPackagesIfEmpty } from './services/packageStore';
import { saveUpressRatesToSupabase, seedUpressRatesIfEmpty } from './services/upressStore';
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
import { calculateMonthlyPayout, calculateQuarterlyPayout, getQuarterPeriods, shiftPeriod } from './utils/payoutEngine';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

const PACKAGE_STORAGE_KEY = 'kalkulator-packages';
const UPRESS_STORAGE_KEY = 'kalkulator-upress-rates';

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

function loadStoredUpressRates() {
  try {
    const storedRates = window.localStorage.getItem(UPRESS_STORAGE_KEY);
    if (!storedRates) return DEFAULT_UPRESS_RATES;

    const parsed = JSON.parse(storedRates) as UpressRate[];
    if (!Array.isArray(parsed)) return DEFAULT_UPRESS_RATES;

    return parsed;
  } catch {
    window.localStorage.removeItem(UPRESS_STORAGE_KEY);
    return DEFAULT_UPRESS_RATES;
  }
}

function App() {
  const now = new Date();
  const hasLoadedRemotePackages = useRef(!isSupabaseConfigured);
  const hasLoadedRemoteUpress = useRef(!isSupabaseConfigured);
  const skipNextAutoSalesLoad = useRef(false);
  const autoLoadedSalesKey = useRef('');
  const shouldAutosaveSales = useRef(false);
  const autosaveVersion = useRef(0);
  const [darkMode, setDarkMode] = useState(false);
  const [packages, setPackages] = useState<IncentivePackage[]>(loadStoredPackages);
  const [upressRates, setUpressRates] = useState<UpressRate[]>(loadStoredUpressRates);
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
  const [deferredSourceSales, setDeferredSourceSales] = useState<SaleItem[]>([]);
  const [isSalesSyncing, setIsSalesSyncing] = useState(false);
  const [salesSyncMessage, setSalesSyncMessage] = useState('');
  const [saveToastMessage, setSaveToastMessage] = useState('');
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
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    seedUpressRatesIfEmpty(loadStoredUpressRates())
      .then((remoteRates) => {
        if (cancelled || !remoteRates || remoteRates.length === 0) return;
        setUpressRates(remoteRates);
        window.localStorage.setItem(UPRESS_STORAGE_KEY, JSON.stringify(remoteRates));
      })
      .catch(() => {
        // Keep the local upress cache usable if the remote table is not ready yet.
      })
      .finally(() => {
        if (!cancelled) hasLoadedRemoteUpress.current = true;
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

  useEffect(() => {
    window.localStorage.setItem(UPRESS_STORAGE_KEY, JSON.stringify(upressRates));

    if (!isSupabaseConfigured || !hasLoadedRemoteUpress.current) return;

    const saveTimer = window.setTimeout(() => {
      saveUpressRatesToSupabase(upressRates).catch(() => {
        // Local cache remains the fallback until the Supabase upress table is available.
      });
    }, 400);

    return () => window.clearTimeout(saveTimer);
  }, [upressRates]);

  const totalSA = calculateTotalSA(sales);
  const activeTier = getTier(totalSA);
  const totalIncentive = calculateTotalIncentive(sales, packages);
  const selectedPeriodId = getPeriodId(selectedYear, selectedMonth);
  const deferredSourcePeriod = useMemo(() => shiftPeriod(selectedYear, selectedMonth, -2), [selectedMonth, selectedYear]);
  const quarterPeriods = useMemo(() => getQuarterPeriods(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const currentQuarterSalesByPeriod = useMemo(
    () => ({
      ...quarterSalesByPeriod,
      [selectedPeriodId]: sales,
    }),
    [quarterSalesByPeriod, sales, selectedPeriodId],
  );
  const monthlyPayout = useMemo(
    () => calculateMonthlyPayout(sales, packages, 80, deferredSourceSales, selectedYear, selectedMonth),
    [deferredSourceSales, packages, sales, selectedMonth, selectedYear],
  );
  const quarterlyPayout = useMemo(
    () => calculateQuarterlyPayout(selectedYear, selectedMonth, currentQuarterSalesByPeriod, upressRates),
    [currentQuarterSalesByPeriod, selectedMonth, selectedYear, upressRates],
  );
  const totalIncome = monthlyPayout.monthlyIncome + quarterlyPayout.totalAmount;

  useEffect(() => {
    if (!saveToastMessage) return;

    const timer = window.setTimeout(() => setSaveToastMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [saveToastMessage]);

  const markSalesDraft = useCallback(() => {
    if (!salesUserId) return;
    shouldAutosaveSales.current = true;
    autosaveVersion.current += 1;
    setSalesSyncMessage('Menyimpan otomatis...');
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
      setDeferredSourceSales([]);
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

  useEffect(() => {
    if (!salesUserId) {
      setDeferredSourceSales([]);
      return;
    }

    let cancelled = false;
    loadSalesEntry(salesUserId, deferredSourcePeriod.periodId)
      .then((entry) => {
        if (!cancelled) setDeferredSourceSales(entry?.sales ?? []);
      })
      .catch(() => {
        if (!cancelled) setDeferredSourceSales([]);
      });

    return () => {
      cancelled = true;
    };
  }, [deferredSourcePeriod.periodId, salesUserId]);

  useEffect(() => {
    if (!salesUserId) {
      autoLoadedSalesKey.current = '';
      return;
    }

    const key = `${salesUserId}:${selectedPeriodId}`;
    if (autoLoadedSalesKey.current === key) return;
    autoLoadedSalesKey.current = key;

    if (skipNextAutoSalesLoad.current) {
      skipNextAutoSalesLoad.current = false;
      return;
    }

    let cancelled = false;
    setIsSalesSyncing(true);
    loadSalesEntry(salesUserId, selectedPeriodId)
      .then((entry) => {
        if (cancelled) return;
        setSales(entry?.sales ?? []);
        setQuarterSalesByPeriod((prev) => ({ ...prev, [selectedPeriodId]: entry?.sales ?? [] }));
        setSalesSyncMessage(entry ? `Data ${MONTHS[selectedMonth - 1]} ${selectedYear} dimuat` : '');
      })
      .catch(() => {
        if (!cancelled) setSalesSyncMessage('Gagal memuat data sales tersimpan.');
      })
      .finally(() => {
        if (!cancelled) setIsSalesSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [salesUserId, selectedPeriodId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!salesUserId || !shouldAutosaveSales.current) return;

    const salesSnapshot = sales;
    const periodSnapshot = selectedPeriodId;
    const monthName = MONTHS[selectedMonth - 1];
    const yearSnapshot = selectedYear;
    const versionSnapshot = autosaveVersion.current;

    const saveTimer = window.setTimeout(() => {
      setIsSalesSyncing(true);
      saveSalesEntry(salesUserId, periodSnapshot, salesSnapshot, packages)
        .then(() => {
          if (autosaveVersion.current === versionSnapshot) shouldAutosaveSales.current = false;
          setQuarterSalesByPeriod((prev) => ({ ...prev, [periodSnapshot]: salesSnapshot }));
          setSalesSyncMessage(`Tersimpan otomatis untuk ${monthName} ${yearSnapshot}`);
          setSaveToastMessage(`Data ${monthName} ${yearSnapshot} otomatis tersimpan.`);
        })
        .catch((error) => {
          setSalesSyncMessage(error instanceof Error ? error.message : 'Gagal menyimpan otomatis.');
        })
        .finally(() => {
          setIsSalesSyncing(false);
        });
    }, 700);

    return () => window.clearTimeout(saveTimer);
  }, [packages, sales, salesUserId, selectedMonth, selectedPeriodId, selectedYear]);

  const scrollToForm = () => {
    document.getElementById('add-form')?.scrollIntoView({ behavior: 'smooth' });
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

  const handleShareRequest = () => {
    if (salesProfile?.name && salesProfile.sales_code) {
      void handleSharePdf(salesProfile.name, salesProfile.sales_code);
      return;
    }

    setShowShareDialog(true);
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
    skipNextAutoSalesLoad.current = sales.length > 0;
    if (sales.length > 0) {
      shouldAutosaveSales.current = true;
      autosaveVersion.current += 1;
    }
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
      setSaveToastMessage('');
      shouldAutosaveSales.current = false;
      setQuarterSalesByPeriod({});
      setDeferredSourceSales([]);
      setShowSalesAccount(false);
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
        onSharePdf={handleShareRequest}
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

        <SummaryCards
          currentMonthSA={totalSA}
          quarterSA={quarterlyPayout.totalQuarterSA}
          totalIncentive={monthlyPayout.monthlyIncome}
          incentiveDetail={`80% bulan ini + 20% ${monthlyPayout.deferredSourcePeriod.label}`}
          totalUpress={quarterlyPayout.totalAmount}
          upressDetail={`Dasar ${formatCurrency(quarterlyPayout.totalQuarterUpressBase)}`}
          totalIncome={totalIncome}
        />

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

        <PayoutSections monthly={monthlyPayout} quarterly={quarterlyPayout} />

        <TargetSimulator sales={sales} packages={packages} totalSA={totalSA} totalIncentive={totalIncentive} />

        <IncentiveReference
          packages={packages}
          activeTier={activeTier}
          upressRates={upressRates}
        />
      </main>

      {/* Mobile and tablet bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex gap-3 lg:hidden print:hidden z-30">
        <button
          onClick={handleShareRequest}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
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
          upressRates={upressRates}
          onUpressUpdate={setUpressRates}
          onClose={() => setShowPackageManager(false)}
          usedPackageIds={usedPackageIds}
        />
      )}

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Perhitungan?"
        message={salesUserId ? 'Data penjualan bulan ini akan dikosongkan dan otomatis disimpan ke database.' : 'Data penjualan sesi sementara pada layar akan dikosongkan.'}
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
        defaultSalespersonName={salesProfile?.name ?? ''}
        defaultSalesCode={salesProfile?.sales_code ?? ''}
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
        onLoad={handleLoadSalesEntry}
        onSignOut={() => {
          void handleSalesSignOut();
        }}
        onClose={() => setShowSalesAccount(false)}
      />
      <Toast message={saveToastMessage} onClose={() => setSaveToastMessage('')} />
    </div>
  );
}

export default App;
