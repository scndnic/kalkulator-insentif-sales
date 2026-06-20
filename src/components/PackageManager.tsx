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

export default function PackageManager({ packages, onUpdate, onClose, usedPackageIds }: PackageManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<IncentivePackage>>({});
  const [newPkg, setNewPkg] = useState<Omit<IncentivePackage, 'id'>>(EMPTY_PKG);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const activeDragId = useRef<string | null>(null);
  const lastDragOverId = useRef<string | null>(null);

  const startEdit = (pkg: IncentivePackage) => {
    setEditingId(pkg.id);
    setEditValues({ ...pkg });
  };

  const saveEdit = (id: string) => {
    if (!editValues.name?.trim()) return;
    onUpdate(packages.map((p) => (p.id === id ? { ...p, ...editValues } as IncentivePackage : p)));
    setEditingId(null);
    setEditValues({});
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

  const handleAdd = () => {
    if (!newPkg.name.trim()) { setAddError('Nama paket tidak boleh kosong.'); return; }
    if (newPkg.productPrice < 0) { setAddError('Harga tidak boleh negatif.'); return; }
    setAddError('');
    onUpdate([...packages, { id: generateId(), ...newPkg }]);
    setNewPkg(EMPTY_PKG);
    setShowAddForm(false);
  };

  const handleReset = () => {
    onUpdate(DEFAULT_PACKAGES);
    setConfirmReset(false);
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
        <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-3xl max-h-[90vh] sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Kelola Data Paket</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default
              </button>
              <button
                onClick={() => { setShowAddForm(!showAddForm); setAddError(''); }}
                className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Paket
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-brand-50 dark:bg-brand-900/20">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-3">Paket Baru</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Nama Paket *</p>
                  <input
                    type="text"
                    value={newPkg.name}
                    onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Nama paket"
                  />
                </div>
                {(['productPrice', 'tier0To5', 'tier6To10', 'tier11To14', 'tier15Plus'] as const).map((f) => (
                  <div key={f}>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {f === 'productPrice' ? 'Harga Produk' : f === 'tier0To5' ? '0–5 SA' : f === 'tier6To10' ? '6–10 SA' : f === 'tier11To14' ? '11–14 SA' : '≥15 SA'}
                    </p>
                    <input
                      type="number"
                      min={0}
                      value={newPkg[f]}
                      onChange={(e) => setNewPkg({ ...newPkg, [f]: Number(e.target.value) })}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>
              {addError && <p className="text-red-500 text-xs mt-2">{addError}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={handleAdd} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors">Simpan</button>
                <button onClick={() => { setShowAddForm(false); setAddError(''); }} className="border border-gray-200 dark:border-gray-700 px-4 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
              </div>
            </div>
          )}

          {/* Package list */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-xs">
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
                  const ev = editValues;
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
                            onPointerDown={(event) => !isEditing && handleDragStart(event, pkg.id)}
                            disabled={isEditing}
                            title="Geser untuk ubah urutan"
                            className="flex h-7 w-7 flex-shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          {isEditing ? (
                            <input
                              value={ev.name ?? pkg.name}
                              onChange={(e) => setEditValues({ ...ev, name: e.target.value })}
                              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-white">{pkg.name}</span>
                          )}
                        </div>
                      </td>
                      {(['productPrice', 'tier0To5', 'tier6To10', 'tier11To14', 'tier15Plus'] as const).map((f, fi) => (
                        <td key={f} className={`px-3 py-2 text-right ${fi === 0 ? 'hidden sm:table-cell' : fi === 1 ? 'hidden sm:table-cell' : ''}`}>
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={ev[f] ?? pkg[f]}
                              onChange={(e) => setEditValues({ ...ev, [f]: Number(e.target.value) })}
                              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs w-24 text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">{formatCurrency(pkg[f])}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => saveEdit(pkg.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => startEdit(pkg)} className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(pkg.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
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
