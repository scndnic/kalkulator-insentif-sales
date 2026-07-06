import { useEffect, useState } from 'react';
import { Plus, ShoppingCart, X } from 'lucide-react';
import { IncentivePackage } from '../types/incentive';
import CustomSelect from './CustomSelect';
import { formatCurrency } from '../utils/formatCurrency';
import { calculatePriceWithPpn } from '../utils/pricing';

interface AddSaleDialogProps {
  isOpen: boolean;
  packages: IncentivePackage[];
  onAdd: (packageId: string, quantity: number) => void;
  onLoadSample: () => void;
  onClose: () => void;
}

export default function AddSaleDialog({
  isOpen,
  packages,
  onAdd,
  onLoadSample,
  onClose,
}: AddSaleDialogProps) {
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const packageOptions = [
    { value: '', label: '-- Pilih paket --' },
    ...packages.map((pkg) => ({
      value: pkg.id,
      label: pkg.name,
      rightLabel: formatCurrency(calculatePriceWithPpn(pkg.productPrice)),
    })),
  ];

  const resetForm = () => {
    setSelectedPackageId('');
    setQuantity(1);
    setError('');
  };

  const handleAdd = () => {
    if (!selectedPackageId) {
      setError('Pilih paket terlebih dahulu.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      setError('Jumlah minimal 1 SA.');
      return;
    }

    onAdd(selectedPackageId, qty);
    resetForm();
    onClose();
  };

  const handleSample = () => {
    onLoadSample();
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-gradient-to-br from-gray-950/70 via-brand-950/35 to-gray-900/70 p-0 backdrop-blur-md sm:items-center sm:p-6 print:hidden">
      <button
        type="button"
        aria-label="Tutup tambah penjualan"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-sale-dialog-title"
        className="relative w-full max-w-lg rounded-t-3xl border border-white/70 bg-white shadow-2xl shadow-gray-950/25 dark:border-gray-800 dark:bg-gray-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="add-sale-dialog-title" className="text-base font-semibold text-gray-900 dark:text-white">
                Tambah Penjualan
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih paket yang terjual dan masukkan jumlah SA.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Pilih Paket
            </label>
            <CustomSelect
              value={selectedPackageId}
              options={packageOptions}
              onChange={(nextValue) => {
                setSelectedPackageId(nextValue);
                setError('');
              }}
              placeholder="-- Pilih paket --"
              buttonClassName="min-h-12"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Jumlah SA
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value === '' ? '' : Number(event.target.value));
                setError('');
              }}
              className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="grid gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:grid-cols-[1fr_auto] sm:px-6">
          <button
            type="button"
            onClick={handleAdd}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <Plus className="h-4 w-4" />
            Tambah Penjualan
          </button>
          <button
            type="button"
            onClick={handleSample}
            className="min-h-11 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Muat Contoh
          </button>
        </div>
      </section>
    </div>
  );
}
