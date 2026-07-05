import { Cloud, DownloadCloud, LogIn, LogOut, Save } from 'lucide-react';
import { SalesProfile } from '../services/authStore';

interface SalesAccountPanelProps {
  profile: SalesProfile | null;
  isConfigured: boolean;
  isSyncing: boolean;
  lastSavedLabel: string;
  onLogin: () => void;
  onSave: () => void;
  onLoad: () => void;
  onSignOut: () => void;
}

export default function SalesAccountPanel({
  profile,
  isConfigured,
  isSyncing,
  lastSavedLabel,
  onLogin,
  onSave,
  onLoad,
  onSignOut,
}: SalesAccountPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 print:hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {profile ? profile.name : 'Akun Sales'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {profile
                ? `${profile.sales_code || 'SC belum diisi'} · ${lastSavedLabel || 'Data bulanan siap disimpan'}`
                : isConfigured
                  ? 'Login untuk menyimpan input bulanan online.'
                  : 'Supabase belum dikonfigurasi.'}
            </p>
          </div>
        </div>

        {profile ? (
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <button
              onClick={onLoad}
              disabled={isSyncing}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <DownloadCloud className="h-3.5 w-3.5" />
              Muat
            </button>
            <button
              onClick={onSave}
              disabled={isSyncing}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              Simpan
            </button>
            <button
              onClick={onSignOut}
              disabled={isSyncing}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            disabled={!isConfigured}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="h-3.5 w-3.5" />
            Login Sales
          </button>
        )}
      </div>
    </section>
  );
}
