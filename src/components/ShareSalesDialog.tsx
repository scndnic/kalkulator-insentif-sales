import { useState } from 'react';
import { Share2, X } from 'lucide-react';

interface ShareSalesDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onSubmit: (data: { salespersonName: string; salesCode: string }) => void;
}

export default function ShareSalesDialog({ isOpen, onCancel, onSubmit }: ShareSalesDialogProps) {
  const [salespersonName, setSalespersonName] = useState('');
  const [salesCode, setSalesCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!salespersonName.trim()) {
      setError('Nama sales wajib diisi.');
      return;
    }
    if (!salesCode.trim()) {
      setError('SC / ID sales wajib diisi.');
      return;
    }
    setError('');
    onSubmit({ salespersonName: salespersonName.trim(), salesCode: salesCode.trim() });
    setSalespersonName('');
    setSalesCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Bagikan PDF</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Isi data sales terlebih dahulu.</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Nama sales</span>
            <input
              autoFocus
              value={salespersonName}
              onChange={(event) => {
                setSalespersonName(event.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Contoh: Budi Santoso"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">SC / ID sales</span>
            <input
              value={salesCode}
              onChange={(event) => {
                setSalesCode(event.target.value);
                setError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSubmit();
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Contoh: SC00123"
            />
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Bagikan
            </button>
            <button
              onClick={onCancel}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
