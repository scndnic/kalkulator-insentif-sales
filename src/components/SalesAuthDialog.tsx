import { useState } from 'react';
import { LogIn, X } from 'lucide-react';

interface SalesAuthDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string, salesCode: string) => Promise<{ needsEmailConfirmation: boolean }>;
}

export default function SalesAuthDialog({ isOpen, onCancel, onSignIn, onSignUp }: SalesAuthDialogProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [salesCode, setSalesCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const handleSubmit = async () => {
    resetFeedback();
    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Nama sales wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await onSignIn(email.trim(), password);
        onCancel();
      } else {
        const result = await onSignUp(email.trim(), password, name.trim(), salesCode.trim());
        setMessage(result.needsEmailConfirmation
          ? 'Akun dibuat. Cek email untuk konfirmasi, lalu login agar profil sales aktif.'
          : 'Akun dan profil sales berhasil dibuat. Silakan login.');
        setMode('signin');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err || '');
      setError(message && message !== '{}' ? message : 'Gagal memproses akun sales. Cek pengaturan Auth Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <LogIn className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {mode === 'signin' ? 'Login Sales' : 'Daftar Sales'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Simpan input penjualan per bulan.</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {mode === 'signup' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Nama</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    resetFeedback();
                  }}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Nama sales"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">SC / ID Sales</span>
                <input
                  value={salesCode}
                  onChange={(event) => {
                    setSalesCode(event.target.value);
                    resetFeedback();
                  }}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Opsional"
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                resetFeedback();
              }}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="nama@email.com"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                resetFeedback();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSubmit();
              }}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Minimal 6 karakter"
            />
          </label>

          {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{message}</p>}
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</p>}

          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Memproses...' : mode === 'signin' ? 'Masuk' : 'Daftar'}
          </button>

          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              resetFeedback();
            }}
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/20"
          >
            {mode === 'signin' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
