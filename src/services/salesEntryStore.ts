import { IncentivePackage, SaleItem } from '../types/incentive';
import { supabase } from './supabaseClient';

type SalesEntryRow = {
  id: string;
  period_id?: string;
  status: string;
  sales_entry_items: Array<{
    id: string;
    package_id: string;
    quantity: number;
  }>;
};

export function getPeriodId(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export async function loadSalesEntry(userId: string, periodId: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('sales_entries')
    .select('id,status,sales_entry_items(id,package_id,quantity)')
    .eq('sales_id', userId)
    .eq('period_id', periodId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const entry = data as SalesEntryRow;
  return {
    id: entry.id,
    status: entry.status,
    sales: entry.sales_entry_items.map((item) => ({
      id: item.id,
      packageId: item.package_id,
      quantity: item.quantity,
    })),
  };
}

export async function loadSalesEntriesForPeriods(userId: string, periodIds: string[]) {
  if (!supabase || periodIds.length === 0) return {};

  const { data, error } = await supabase
    .from('sales_entries')
    .select('id,period_id,status,sales_entry_items(id,package_id,quantity)')
    .eq('sales_id', userId)
    .in('period_id', periodIds);

  if (error) throw error;

  return ((data ?? []) as SalesEntryRow[]).reduce<Record<string, SaleItem[]>>((entries, entry) => {
    if (!entry.period_id) return entries;
    entries[entry.period_id] = entry.sales_entry_items.map((item) => ({
      id: item.id,
      packageId: item.package_id,
      quantity: item.quantity,
    }));
    return entries;
  }, {});
}

export async function saveSalesEntry(
  userId: string,
  periodId: string,
  sales: SaleItem[],
  packages: IncentivePackage[],
) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data: entry, error: entryError } = await supabase
    .from('sales_entries')
    .upsert(
      {
        sales_id: userId,
        period_id: periodId,
        status: 'draft',
      },
      { onConflict: 'sales_id,period_id' },
    )
    .select('id')
    .single();

  if (entryError) throw entryError;

  const entryId = entry.id as string;
  const packageMap = new Map(packages.map((pkg) => [pkg.id, pkg]));
  const rows = sales.map((sale) => {
    const pkg = packageMap.get(sale.packageId);
    return {
      entry_id: entryId,
      package_id: sale.packageId,
      quantity: sale.quantity,
      product_price: pkg?.productPrice ?? 0,
      package_snapshot: pkg ?? {},
    };
  });

  if (rows.length > 0) {
    const { error: itemsError } = await supabase
      .from('sales_entry_items')
      .upsert(rows, { onConflict: 'entry_id,package_id' });

    if (itemsError) throw itemsError;
  }

  const currentPackageIds = sales.map((sale) => sale.packageId);
  let deleteQuery = supabase.from('sales_entry_items').delete().eq('entry_id', entryId);
  if (currentPackageIds.length > 0) {
    deleteQuery = deleteQuery.not('package_id', 'in', `(${currentPackageIds.map((id) => `"${id}"`).join(',')})`);
  }

  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw deleteError;

  return entryId;
}
