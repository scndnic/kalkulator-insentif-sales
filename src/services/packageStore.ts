import { createClient } from '@supabase/supabase-js';
import { IncentivePackage } from '../types/incentive';

const PACKAGE_TABLE = 'incentive_packages';

type PackageRow = {
  id: string;
  name: string;
  product_price: number;
  tier_0_to_5: number;
  tier_6_to_10: number;
  tier_11_to_14: number;
  tier_15_plus: number;
  sort_order: number;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

function rowToPackage(row: PackageRow): IncentivePackage {
  return {
    id: row.id,
    name: row.name,
    productPrice: row.product_price,
    tier0To5: row.tier_0_to_5,
    tier6To10: row.tier_6_to_10,
    tier11To14: row.tier_11_to_14,
    tier15Plus: row.tier_15_plus,
  };
}

function packageToRow(pkg: IncentivePackage, index: number): PackageRow {
  return {
    id: pkg.id,
    name: pkg.name,
    product_price: pkg.productPrice,
    tier_0_to_5: pkg.tier0To5,
    tier_6_to_10: pkg.tier6To10,
    tier_11_to_14: pkg.tier11To14,
    tier_15_plus: pkg.tier15Plus,
    sort_order: index,
  };
}

export async function fetchPackagesFromSupabase() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(PACKAGE_TABLE)
    .select('id,name,product_price,tier_0_to_5,tier_6_to_10,tier_11_to_14,tier_15_plus,sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return (data as PackageRow[]).map(rowToPackage);
}

export async function savePackagesToSupabase(packages: IncentivePackage[]) {
  if (!supabase) return false;

  const rows = packages.map(packageToRow);
  const { error: upsertError } = await supabase
    .from(PACKAGE_TABLE)
    .upsert(rows, { onConflict: 'id' });

  if (upsertError) throw upsertError;

  const { data: existingRows, error: fetchError } = await supabase
    .from(PACKAGE_TABLE)
    .select('id');

  if (fetchError) throw fetchError;

  const currentIds = new Set(packages.map((pkg) => pkg.id));
  const deletedIds = (existingRows ?? [])
    .map((row) => row.id as string)
    .filter((id) => !currentIds.has(id));

  if (deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(PACKAGE_TABLE)
      .delete()
      .in('id', deletedIds);

    if (deleteError) throw deleteError;
  }

  return true;
}

export async function seedPackagesIfEmpty(packages: IncentivePackage[]) {
  const storedPackages = await fetchPackagesFromSupabase();
  if (storedPackages === null) return null;
  if (storedPackages.length > 0) return storedPackages;

  await savePackagesToSupabase(packages);
  return packages;
}
