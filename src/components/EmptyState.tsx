import { ShoppingCart, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mb-4">
        <ShoppingCart className="w-8 h-8 text-brand-400 dark:text-brand-500" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Belum ada paket yang ditambahkan</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        Pilih paket dan masukkan jumlah penjualan untuk mulai menghitung insentif.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Tambah Penjualan
      </button>
    </div>
  );
}
