import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Edit2, Check, GripVertical, Package, Users } from 'lucide-react';
import { IncentivePackage, UpressRate, UpressTierKey } from '../types/incentive';
import { DEFAULT_PACKAGES, DEFAULT_UPRESS_RATES } from '../data/incentives';
import { formatCurrency } from '../utils/formatCurrency';
import ConfirmDialog from './ConfirmDialog';
import CustomSelect from './CustomSelect';
import {
  AdminSalesProfile,
  AdminUserSummary,
  deleteSalesProfile,
  fetchAdminUserSummaries,
  upsertSalesProfile,
} from '../services/adminUserStore';

interface PackageManagerProps {
  packages: IncentivePackage[];
  onUpdate: (packages: IncentivePackage[]) => void;
  upressRates: UpressRate[];
  onUpressUpdate: (rates: UpressRate[]) => void;
  selectedMonth: number;
  selectedYear: number;
  syncMessage: string;
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

const EMPTY_UPRESS: UpressRate = {
  packageId: '',
  tier10: 0,
  tier15: 0,
  tier20: 0,
  tier25: 0,
};

const UPRESS_FORM_FIELDS: Array<{ key: UpressTierKey; label: string }> = [
  { key: 'tier10', label: '10 SA' },
  { key: 'tier15', label: '15 SA' },
  { key: 'tier20', label: '20 SA' },
  { key: 'tier25', label: '25 SA' },
];

const EMPTY_USER_FORM: AdminSalesProfile = {
  id: '',
  name: '',
  sales_code: '',
  role: 'sales',
  is_active: true,
};

export default function PackageManager({
  packages,
  onUpdate,
  upressRates,
  onUpressUpdate,
  selectedMonth,
  selectedYear,
  syncMessage,
  onClose,
  usedPackageIds,
}: PackageManagerProps) {
  const [activePage, setActivePage] = useState<'packages' | 'users'>('packages');
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<IncentivePackage, 'id'>>(EMPTY_PKG);
  const [upressFormMode, setUpressFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingUpressId, setEditingUpressId] = useState<string | null>(null);
  const [upressFormValues, setUpressFormValues] = useState<UpressRate>(EMPTY_UPRESS);
  const [userFormMode, setUserFormMode] = useState<'add' | 'edit' | null>(null);
  const [userFormValues, setUserFormValues] = useState<AdminSalesProfile>(EMPTY_USER_FORM);
  const [userRows, setUserRows] = useState<AdminUserSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [upressFormError, setUpressFormError] = useState('');
  const [userFormError, setUserFormError] = useState('');
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

  const startAddUpress = () => {
    setUpressFormMode('add');
    setEditingUpressId(null);
    setUpressFormValues(EMPTY_UPRESS);
    setUpressFormError('');
  };

  const startEditUpress = (rate: UpressRate) => {
    setUpressFormMode('edit');
    setEditingUpressId(rate.packageId);
    setUpressFormValues(rate);
    setUpressFormError('');
  };

  const closeUpressForm = () => {
    setUpressFormMode(null);
    setEditingUpressId(null);
    setUpressFormValues(EMPTY_UPRESS);
    setUpressFormError('');
  };

  const loadUsers = () => {
    setIsLoadingUsers(true);
    setUserError('');
    fetchAdminUserSummaries(selectedYear, selectedMonth, packages, upressRates)
      .then(setUserRows)
      .catch((error) => {
        setUserRows([]);
        setUserError(error instanceof Error ? error.message : 'Gagal memuat data user.');
      })
      .finally(() => setIsLoadingUsers(false));
  };

  const startAddUser = () => {
    setUserFormMode('add');
    setUserFormValues(EMPTY_USER_FORM);
    setUserFormError('');
  };

  const startEditUser = (user: AdminUserSummary) => {
    setUserFormMode('edit');
    setUserFormValues({
      id: user.id,
      name: user.name,
      sales_code: user.sales_code,
      role: user.role,
      is_active: user.is_active,
    });
    setUserFormError('');
  };

  const closeUserForm = () => {
    setUserFormMode(null);
    setUserFormValues(EMPTY_USER_FORM);
    setUserFormError('');
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
    onUpressUpdate(DEFAULT_UPRESS_RATES);
    setConfirmReset(false);
    closeForm();
    closeUpressForm();
  };

  const handleSubmitUpressForm = () => {
    if (!upressFormValues.packageId) {
      setUpressFormError('Pilih produk terlebih dahulu.');
      return;
    }
    if (UPRESS_FORM_FIELDS.some(({ key }) => upressFormValues[key] < 0)) {
      setUpressFormError('Nominal upress tidak boleh negatif.');
      return;
    }
    const isDuplicate = upressFormMode === 'add' && upressRates.some((rate) => rate.packageId === upressFormValues.packageId);
    if (isDuplicate) {
      setUpressFormError('Produk ini sudah ada di tabel upress.');
      return;
    }

    if (upressFormMode === 'edit' && editingUpressId) {
      onUpressUpdate(upressRates.map((rate) => (
        rate.packageId === editingUpressId ? upressFormValues : rate
      )));
    } else {
      onUpressUpdate([...upressRates, upressFormValues]);
    }
    closeUpressForm();
  };

  const handleDeleteUpress = (packageId: string) => {
    onUpressUpdate(upressRates.filter((rate) => rate.packageId !== packageId));
    if (editingUpressId === packageId) closeUpressForm();
  };

  const handleSubmitUserForm = () => {
    const cleanProfile = {
      ...userFormValues,
      id: userFormValues.id.trim(),
      name: userFormValues.name.trim(),
      sales_code: userFormValues.sales_code?.trim() || null,
    };

    if (!cleanProfile.id) {
      setUserFormError('Auth User ID wajib diisi.');
      return;
    }
    if (!cleanProfile.name) {
      setUserFormError('Nama sales wajib diisi.');
      return;
    }

    setIsLoadingUsers(true);
    upsertSalesProfile(cleanProfile)
      .then(() => {
        closeUserForm();
        loadUsers();
      })
      .catch((error) => {
        setUserFormError(error instanceof Error ? error.message : 'Gagal menyimpan user.');
      })
      .finally(() => setIsLoadingUsers(false));
  };

  const confirmDeleteUserAction = () => {
    if (!confirmDeleteUser) return;
    setIsLoadingUsers(true);
    deleteSalesProfile(confirmDeleteUser)
      .then(() => {
        setConfirmDeleteUser(null);
        loadUsers();
      })
      .catch((error) => setUserError(error instanceof Error ? error.message : 'Gagal menghapus user.'))
      .finally(() => setIsLoadingUsers(false));
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

  useEffect(() => {
    if (activePage === 'users') loadUsers();
  }, [activePage, selectedMonth, selectedYear, packages, upressRates]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 print:hidden">
        <div className="flex h-dvh w-full flex-col bg-white dark:bg-gray-950">
          {/* Header */}
          <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-white sm:text-lg">Mode Admin</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Atur paket dan pantau user sales.</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
                aria-label="Keluar dari mode admin"
                title="Keluar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setActivePage('packages')}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'packages'
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-gray-900 dark:text-brand-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Package className="h-4 w-4" />
                Atur Paket
              </button>
              <button
                type="button"
                onClick={() => setActivePage('users')}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'users'
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-gray-900 dark:text-brand-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                Management User
              </button>
            </div>
          </div>

          {activePage === 'packages' && (
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-6">
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
            </div>
          )}

          {activePage === 'packages' && formMode && (
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/50 sm:px-6">
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

          {activePage === 'packages' && (
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

            <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tabel Upress</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nominal per SA berdasarkan total SA bulanan produk upress.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onUpressUpdate(DEFAULT_UPRESS_RATES)}
                    className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Reset Upress
                  </button>
                  <button
                    type="button"
                    onClick={startAddUpress}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Upress
                  </button>
                </div>
              </div>

              {upressFormMode && (
                <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {upressFormMode === 'edit' ? 'Edit Upress' : 'Tambah Upress'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pilih produk dan isi nominal upress per SA.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <label className="lg:col-span-1">
                      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Produk</span>
                      <CustomSelect
                        value={upressFormValues.packageId}
                        options={[
                          { value: '', label: 'Pilih produk' },
                          ...packages.map((pkg) => ({ value: pkg.id, label: pkg.name })),
                        ]}
                        onChange={(value) => {
                          if (upressFormMode === 'edit') return;
                          setUpressFormValues({ ...upressFormValues, packageId: value });
                          setUpressFormError('');
                        }}
                        placeholder="Pilih produk"
                        className={upressFormMode === 'edit' ? 'pointer-events-none opacity-70' : ''}
                        buttonClassName="h-11 rounded-xl bg-white dark:bg-gray-900"
                      />
                    </label>

                    {UPRESS_FORM_FIELDS.map(({ key, label }) => (
                      <label key={key}>
                        <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
                        <input
                          type="number"
                          min={0}
                          value={upressFormValues[key]}
                          onChange={(event) => setUpressFormValues({ ...upressFormValues, [key]: Number(event.target.value) })}
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </label>
                    ))}
                  </div>

                  {upressFormError && <p className="mt-3 text-xs font-medium text-red-500">{upressFormError}</p>}

                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeUpressForm}
                      className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitUpressForm}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                    >
                      <Check className="h-4 w-4" />
                      Simpan Upress
                    </button>
                  </div>
                </div>
              )}

              {syncMessage && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-xs font-medium ${
                  syncMessage.toLowerCase().includes('gagal') || syncMessage.toLowerCase().includes('belum tersambung')
                    ? 'border-red-100 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300'
                }`}>
                  {syncMessage}
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                <table className="min-w-[720px] w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Produk</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">10 SA</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">15 SA</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">20 SA</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">25 SA</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {upressRates.map((rate) => {
                      const pkg = packages.find((item) => item.id === rate.packageId);
                      return (
                        <tr key={rate.packageId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900 dark:text-white">{pkg?.name ?? rate.packageId}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-gray-600 dark:text-gray-400">{formatCurrency(rate.tier10)}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-gray-600 dark:text-gray-400">{formatCurrency(rate.tier15)}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-gray-600 dark:text-gray-400">{formatCurrency(rate.tier20)}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-gray-600 dark:text-gray-400">{formatCurrency(rate.tier25)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEditUpress(rate)}
                                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20"
                                title="Edit upress"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUpress(rate.packageId)}
                                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                                title="Hapus upress"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
          )}

          {activePage === 'users' && (
            <div className="flex-1 overflow-auto px-4 py-4 sm:px-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Management User</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Kelola profil sales dan lihat ringkasan pendapatan triwulan.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={loadUsers}
                    className="h-10 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={startAddUser}
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah User
                  </button>
                </div>
              </div>

              {userFormMode && (
                <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {userFormMode === 'edit' ? 'Edit User' : 'Tambah User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gunakan Auth User ID dari Supabase untuk profil sales yang sudah memiliki akun login.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <label className="lg:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Auth User ID</span>
                      <input
                        value={userFormValues.id}
                        disabled={userFormMode === 'edit'}
                        onChange={(event) => setUserFormValues({ ...userFormValues, id: event.target.value })}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
                        placeholder="UUID user dari Supabase Auth"
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Nama Sales</span>
                      <input
                        value={userFormValues.name}
                        onChange={(event) => setUserFormValues({ ...userFormValues, name: event.target.value })}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Nama sales"
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">SC / ID Sales</span>
                      <input
                        value={userFormValues.sales_code ?? ''}
                        onChange={(event) => setUserFormValues({ ...userFormValues, sales_code: event.target.value })}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="SC00123"
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Role</span>
                      <CustomSelect
                        value={userFormValues.role}
                        options={[
                          { value: 'sales', label: 'Sales' },
                          { value: 'admin', label: 'Admin' },
                        ]}
                        onChange={(value) => setUserFormValues({ ...userFormValues, role: value as 'sales' | 'admin' })}
                        buttonClassName="h-11 rounded-xl bg-white dark:bg-gray-900"
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</span>
                      <CustomSelect
                        value={userFormValues.is_active ? 'active' : 'inactive'}
                        options={[
                          { value: 'active', label: 'Aktif' },
                          { value: 'inactive', label: 'Nonaktif' },
                        ]}
                        onChange={(value) => setUserFormValues({ ...userFormValues, is_active: value === 'active' })}
                        buttonClassName="h-11 rounded-xl bg-white dark:bg-gray-900"
                      />
                    </label>
                  </div>

                  {userFormError && <p className="mt-3 text-xs font-medium text-red-500">{userFormError}</p>}

                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeUserForm}
                      className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitUserForm}
                      disabled={isLoadingUsers}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      Simpan User
                    </button>
                  </div>
                </div>
              )}

              {userError && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                  {userError}
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                <table className="min-w-[900px] w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">User</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">SC</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Total Insentif</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Total Upress</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Total Pendapatan</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {isLoadingUsers && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Memuat user...</td>
                      </tr>
                    )}
                    {!isLoadingUsers && userRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Belum ada data user yang bisa ditampilkan.</td>
                      </tr>
                    )}
                    {!isLoadingUsers && userRows.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-gray-400 dark:text-gray-500">{user.id}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{user.sales_code || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">{formatCurrency(user.totalIncentive)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">{formatCurrency(user.totalUpress)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(user.totalIncome)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditUser(user)}
                              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20"
                              title="Edit user"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUser(user.id)}
                              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                              title="Hapus user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
      <ConfirmDialog
        isOpen={!!confirmDeleteUser}
        title="Hapus User?"
        message="Profil sales ini akan dihapus. Akun Auth hanya bisa dihapus dari Supabase Auth."
        confirmLabel="Hapus"
        onConfirm={confirmDeleteUserAction}
        onCancel={() => setConfirmDeleteUser(null)}
        danger
      />
    </>
  );
}
