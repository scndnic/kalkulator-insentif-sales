import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { IncentivePackage } from '../types/incentive';

interface AddSaleFormProps {
  packages: IncentivePackage[];
  onAdd: (packageId: string, quantity: number) => void;
  onLoadSample: () => void;
}

export default function AddSaleForm({ packages, onAdd, onLoadSample }: AddSaleFormProps) {
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!selectedPackageId) {
      setError('Pilih paket terlebih dahulu.');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      setError('Jumlah minimal 1.');
      return;
    }
    setError('');
    onAdd(selectedPackageId, qty);
    setQuantity(1);
    setSelectedPackageId('');
  };

  const handleClear = () => {
    setSelectedPackageId('');
    setQuantity(1);
    setError('');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sm:p-6 print:hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Tambah Penjualan</h2>
        <button
          onClick={onLoadSample}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
        >
          Muat Data Contoh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pilih Paket</label>
          <select
            value={selectedPackageId}
            onChange={(e) => { setSelectedPackageId(e.target.value); setError(''); }}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">-- Pilih paket --</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-36">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Jumlah SA</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value === '' ? '' : Number(e.target.value)); setError(''); }}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-2 sm:items-end sm:mt-0 mt-1">
          <button
            onClick={handleAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
          <button
            onClick={handleClear}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            title="Bersihkan form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}
