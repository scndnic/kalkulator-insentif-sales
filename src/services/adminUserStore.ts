import { IncentivePackage, SaleItem, UpressRate } from '../types/incentive';
import { calculateTotalSA } from '../utils/calculateIncentive';
import { calculateMonthlyPayout, calculateQuarterlyPayout, getQuarterPeriods } from '../utils/payoutEngine';
import { createIsolatedSupabaseClient, supabase } from './supabaseClient';

export type AdminSalesProfile = {
  id: string;
  name: string;
  sales_code: string | null;
  role: 'sales' | 'admin';
  is_active: boolean;
};

export type AdminUserSummary = AdminSalesProfile & {
  totalSA: number;
  totalIncentive: number;
  totalUpress: number;
  totalIncome: number;
};

export type AdminCreateSalesUserInput = Omit<AdminSalesProfile, 'id'> & {
  email: string;
  password: string;
};

type EntryRow = {
  sales_id: string;
  period_id: string;
  sales_entry_items: Array<{
    id: string;
    package_id: string;
    quantity: number;
  }>;
};

function entryItemsToSales(items: EntryRow['sales_entry_items']): SaleItem[] {
  return items.map((item) => ({
    id: item.id,
    packageId: item.package_id,
    quantity: item.quantity,
  }));
}

export async function fetchAdminUserSummaries(
  year: number,
  month: number,
  packages: IncentivePackage[],
  upressRates: UpressRate[],
) {
  if (!supabase) return [];

  const { data: profiles, error: profileError } = await supabase
    .from('sales_profiles')
    .select('id,name,sales_code,role,is_active')
    .order('name', { ascending: true });

  if (profileError) throw profileError;

  const quarterIds = getQuarterPeriods(year, month).map((period) => period.periodId);
  const { data: entries, error: entryError } = await supabase
    .from('sales_entries')
    .select('sales_id,period_id,sales_entry_items(id,package_id,quantity)')
    .in('period_id', quarterIds);

  if (entryError) throw entryError;

  const entriesBySales = ((entries ?? []) as EntryRow[]).reduce<Record<string, Record<string, SaleItem[]>>>((result, entry) => {
    result[entry.sales_id] = result[entry.sales_id] ?? {};
    result[entry.sales_id][entry.period_id] = entryItemsToSales(entry.sales_entry_items ?? []);
    return result;
  }, {});

  return ((profiles ?? []) as AdminSalesProfile[]).map<AdminUserSummary>((profile) => {
    const periodSales = entriesBySales[profile.id] ?? {};
    const currentSales = periodSales[`${year}-${String(month).padStart(2, '0')}`] ?? [];
    const monthly = calculateMonthlyPayout(currentSales, packages, 80, [], year, month);
    const quarterly = calculateQuarterlyPayout(year, month, periodSales, upressRates);

    return {
      ...profile,
      totalSA: Object.values(periodSales).reduce((total, sales) => total + calculateTotalSA(sales), 0),
      totalIncentive: monthly.monthlyIncome,
      totalUpress: quarterly.totalAmount,
      totalIncome: monthly.monthlyIncome + quarterly.totalAmount,
    };
  });
}

export async function upsertSalesProfile(profile: AdminSalesProfile) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { error } = await supabase
    .from('sales_profiles')
    .upsert(profile, { onConflict: 'id' });

  if (error) throw error;
}

export async function createSalesAuthUser(input: AdminCreateSalesUserInput) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const isolatedSupabase = createIsolatedSupabaseClient();
  if (!isolatedSupabase) throw new Error('Supabase belum dikonfigurasi.');

  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name.trim();
  const cleanSalesCode = input.sales_code?.trim() || null;

  if (!cleanEmail) throw new Error('Email wajib diisi.');
  if (!cleanName) throw new Error('Nama sales wajib diisi.');
  if (input.password.length < 6) throw new Error('Password minimal 6 karakter.');

  const { data, error } = await isolatedSupabase.auth.signUp({
    email: cleanEmail,
    password: input.password,
    options: {
      data: {
        name: cleanName,
        sales_code: cleanSalesCode,
        role: input.role,
      },
    },
  });

  if (error) {
    if (error.message === '{}') {
      throw new Error('Supabase Auth menolak pendaftaran. Gunakan email valid dan password yang lebih unik.');
    }
    throw error;
  }
  if (!data.user) throw new Error('Auth user gagal dibuat.');

  const profile: AdminSalesProfile = {
    id: data.user.id,
    name: cleanName,
    sales_code: cleanSalesCode,
    role: input.role,
    is_active: input.is_active,
  };

  await upsertSalesProfile(profile);
  await isolatedSupabase.auth.signOut();

  return profile;
}

export async function deleteSalesProfile(id: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { error } = await supabase
    .from('sales_profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
