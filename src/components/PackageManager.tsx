import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Edit2, Check, GripVertical } from 'lucide-react';
import { IncentivePackage } from '../types/incentive';
import { DEFAULT_PACKAGES } from '../data/incentives';
import { formatCurrency } from '../utils/formatCurrency';
import ConfirmDialog from './ConfirmDialog';

interface PackageManagerProps {
  packages: IncentivePackage[];
  onUpdate: (packages: IncentivePackage[]) => void;
  onClose: () => void;
  usedPackageIds: string[];
}

function generateId() {
  return 'pkg_' + Math.random().toString(36).slice(2, 9);
}

const EMPTY_PKG: Omit<IncentivePackage, 'id'> = {
  name: '',
  productPrice: 0,
  tier0To5: 0,
  tier6To10: 0,
  tier11To14: 0,
  tier15Plus: 0,
};

const PACKAGE_FORM_FIELDS: Array<{
  key: keyof Omit<IncentivePackage, 'id' | 'name'>;
  label: string;
  helper: string;
}> = [
  { key: 'productPrice', label: 'Harga Produk', helper: 'Harga sebelum PPN' },
  { key: 'tier0To5', label: '0-5 SA', helper: 'Insentif per SA' },
  { key: 'tier6To10', label: '6-10 SA', helper: 'Insentif per SA' },
  { key: 'tier11To14', label: '11-14 SA', helper: 'Insentif per SA' },
  { key: 'tier15Plus', label: '>=15 SA', helper: 'Insentif per SA' },
];

export default function PackageManager({ packages, onUpdate, onClose, usedPackageIds }: PackageManagerProps) {
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<IncentivePackage, 'id'>>(EMPTY_PKG);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const activeDragId = useRef<string | null>(null);
  const lastDragOverId = useRef<string | null>(null);

  const startAdd = () => {
    setFormMode('add');
    setEditingId(null);
    setFormValues(EMPTY_PKG);
    setFormError('');
  };

  const startEdit = (pkg: IncentivePackage) => {
    setFormMode('edit');
    setEditingId(pkg.id);
    setFormValues({
      name: pkg.name,
      productPrice: pkg.productPrice,
      tier0To5: pkg.tier0To5,
      tier6To10: pkg.tier6To10,
      tier11To14: pkg.tier11To14,
      tier15Plus: pkg.tier15Plus,
    });
    setFormError('');
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setFormValues(EMPTY_PKG);
    setFormError('');
  };

  const handleSubmitForm = () => {
    const cleanValues = { ...formValues, name: formValues.name.trim() };
    if (!cleanValues.name) {
      setFormError('Nama paket tidak boleh kosong.');
      return;
    }
    if (PACKAGE_FORM_FIELDS.some(({ key }) => cleanValues[key] < 0)) {
      setFormError('Harga dan nominal insentif tidak boleh negatif.');
      return;
    }

    if (formMode === 'edit' && editingId) {
      onUpdate(packages.map((p) => (p.id === editingId ? { id: p.id, ...cleanValues } : p)));
    } else {
      onUpdate([...packages, { id: generateId(), ...cleanValues }]);
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    if (usedPackageIds.includes(id)) {
      alert('Paket ini sedang digunakan dalam kalkulasi. Hapus dari tabel penjualan terlebih dahulu.');
      return;
    }
    setConfirmDelete(id);
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    onUpdate(packages.filter((p) => p.id !== confirmDelete));
    setConfirmDelete(null);
  };

  const handleReset = () => {
    onUpdate(DEFAULT_PACKAGES);
    setConfirmReset(false);
    closeForm();
  };

  const movePackage = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromIndex = packages.findIndex((pkg) => pkg.id === fromId);
    const toIndex = packages.findIndex((pkg) => pkg.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;

    const nextPackages = [...packages];
    const [movedPackage] = nextPackages.splice(fromIndex, 1);
    nextPackages.splice(toIndex, 0, movedPackage);
    onUpdate(nextPackages);
  };

  const handleDragStart = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    activeDragId.current = id;
    lastDragOverId.current = null;
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    activeDragId.current = null;
    setDraggedId(null);
    setDragOverId(null);
    lastDragOverId.current = null;
  };

  useEffect(() => {
    if (!draggedId) return;

    const handlePointerMove = (event: PointerEvent) => {
      const targetRow = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLTableRowElement>('tr[data-package-id]');
      const targetId = targetRow?.dataset.packageId;
      const sourceId = activeDragId.current;
      if (!sourceId || !targetId || sourceId === targetId || lastDragOverId.current === targetId) return;
      lastDragOverId.current = targetId;
      setDragOverId(targetId);
      movePackage(sourceId, targetId);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handleDragEnd, { once: true });
    window.addEventListener('pointercancel', handleDragEnd, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('pointercancel', handleDragEnd);
    };
  }, [draggedId, packages]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800">
          {/* Header */}
          <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-white">Kelola Data Paket</h2>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                onClick={() => setConfirmReset(true)}
                className="flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 sm:px-3"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
              <button
                onClick={startAdd}
                className="flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Paket
              </button>
              <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Package form */}
          {formMode && (
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/50">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formMode === 'edit' ? 'Edit Paket' : 'Tambah Paket'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Isi data paket dan nominal insentif sesuai tier SA.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <label className="lg:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Nama Paket</span>
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Contoh: Fast 150"
                  />
                </label>

                {PACKAGE_FORM_FIELDS.map(({ key, label, helper }) => (
                  <label key={key}>
                    <span className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <span>{label}</span>
                      <span className="font-normal text-gray-400 dark:text-gray-500">{helper}</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={formValues[key]}
                      onChange={(e) => setFormValues({ ...formValues, [key]: Number(e.target.value) })}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </label>
                ))}
              </div>

              {formError && <p className="mt-3 text-xs font-medium text-red-500">{formError}</p>}

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={closeForm}
                  className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitForm}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                  <Check className="h-4 w-4" />
                  Simpan Paket
                </button>
              </div>
            </div>
          )}

          {/* Package list */}
          <div className="flex-1 overflow-auto">
            <table className="min-w-[760px] w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Paket</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Harga</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">0–5</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">6–10</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">11–14</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">≥15</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 dark:text-gray-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {packages.map((pkg) => {
                  const isEditing = editingId === pkg.id;
                  return (
                    <tr
                      key={pkg.id}
                      data-package-id={pkg.id}
                      className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        isEditing ? 'bg-brand-50 dark:bg-brand-900/10' : ''
                      } ${
                        draggedId === pkg.id ? 'opacity-60' : ''
                      } ${
                        dragOverId === pkg.id && draggedId !== pkg.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                      }`}
                    >
                      <td className="px-5 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onPointerDown={(event) => handleDragStart(event, pkg.id)}
                            disabled={isEditing}
                            title="Geser untuk ubah urutan"
                            className="flex h-7 w-7 flex-shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <span className="font-medium text-gray-900 dark:text-white">{pkg.name}</span>
                        </div>
                      </td>
                      {(['productPrice', 'tier0To5', 'tier6To10', 'tier11To14', 'tier15Plus'] as const).map((f, fi) => (
                        <td key={f} className={`px-3 py-2 text-right ${fi === 0 ? 'hidden sm:table-cell' : fi === 1 ? 'hidden sm:table-cell' : ''}`}>
                          <span className="text-gray-600 dark:text-gray-400">{formatCurrency(pkg[f])}</span>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(pkg)}
                            className={`p-1 rounded-lg ${
                              isEditing
                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20'
                                : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                            }`}
                            title="Edit paket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Hapus paket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmReset}
        title="Reset ke Data Default?"
        message="Semua perubahan pada daftar paket akan dikembalikan ke data awal."
        confirmLabel="Ya, Reset"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
        danger
      />
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Hapus Paket?"
        message="Paket ini akan dihapus dari daftar. Aksi ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
    </>
  );
}
