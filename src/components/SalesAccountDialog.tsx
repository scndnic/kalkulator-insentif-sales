import { Cloud, DownloadCloud, LogIn, LogOut, Save, X } from 'lucide-react';
import { SalesProfile } from '../services/authStore';

interface SalesAccountDialogProps {
  isOpen: boolean;
  profile: SalesProfile | null;
  isConfigured: boolean;
  isSyncing: boolean;
  lastSavedLabel: string;
  onLogin: () => void;
  onSave: () => void;
  onLoad: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export default function SalesAccountDialog({
  isOpen,
  profile,
  isConfigured,
  isSyncing,
  lastSavedLabel,
  onLogin,
  onSave,
  onLoad,
  onSignOut,
  onClose,
}: SalesAccountDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/50 px-4 py-20 backdrop-blur-sm print:hidden">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <Cloud className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Akun Sales</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {profile ? 'Data input bulanan online' : 'Login untuk menyimpan data'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {profile ? profile.name : 'Belum login'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {profile
                ? `${profile.sales_code || 'SC belum diisi'} · ${lastSavedLabel || 'Data bulanan siap disimpan'}`
                : isConfigured
                  ? 'Masuk atau daftar akun sales untuk menyimpan input per bulan.'
                  : 'Supabase belum dikonfigurasi.'}
            </p>
          </div>

          {profile ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={onLoad}
                disabled={isSyncing}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <DownloadCloud className="h-4 w-4" />
                Muat
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSyncing}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Simpan
              </button>
              <button
                type="button"
                onClick={onSignOut}
                disabled={isSyncing}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              disabled={!isConfigured}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              Login Sales
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
