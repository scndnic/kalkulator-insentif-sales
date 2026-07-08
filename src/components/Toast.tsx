import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string;
  status?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, status = 'success', onClose }: ToastProps) {
  if (!message) return null;

  const isSuccess = status === 'success';

  return (
    <button
      type="button"
      onClick={onClose}
      title={message}
      aria-label={isSuccess ? 'Data berhasil tersimpan' : 'Data gagal tersimpan'}
      className={`fixed right-4 top-20 z-[60] flex h-11 w-11 items-center justify-center rounded-full border shadow-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:right-6 lg:right-8 print:hidden ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-500 text-white shadow-emerald-500/25 focus:ring-emerald-500 dark:border-emerald-700'
          : 'border-red-200 bg-red-500 text-white shadow-red-500/25 focus:ring-red-500 dark:border-red-700'
      }`}
    >
      {isSuccess ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
    </button>
  );
}
