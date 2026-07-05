import { UpressRate } from '../types/incentive';
import { supabase } from './supabaseClient';

const UPRESS_TABLE = 'upress_package_rates';

type UpressRateRow = {
  package_id: string;
  tier_10: number;
  tier_15: number;
  tier_20: number;
  tier_25: number;
  sort_order: number;
};

function rowToRate(row: UpressRateRow): UpressRate {
  return {
    packageId: row.package_id,
    tier10: row.tier_10,
    tier15: row.tier_15,
    tier20: row.tier_20,
    tier25: row.tier_25,
  };
}

function rateToRow(rate: UpressRate, index: number): UpressRateRow {
  return {
    package_id: rate.packageId,
    tier_10: rate.tier10,
    tier_15: rate.tier15,
    tier_20: rate.tier20,
    tier_25: rate.tier25,
    sort_order: index,
  };
}

export async function fetchUpressRatesFromSupabase() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(UPRESS_TABLE)
    .select('package_id,tier_10,tier_15,tier_20,tier_25,sort_order')
    .order('sort_order', { ascending: true })
    .order('package_id', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return (data as UpressRateRow[]).map(rowToRate);
}

export async function saveUpressRatesToSupabase(rates: UpressRate[]) {
  if (!supabase) return false;

  const rows = rates.map(rateToRow);
  const { error: upsertError } = await supabase
    .from(UPRESS_TABLE)
    .upsert(rows, { onConflict: 'package_id' });

  if (upsertError) throw upsertError;

  const { data: existingRows, error: fetchError } = await supabase
    .from(UPRESS_TABLE)
    .select('package_id');

  if (fetchError) throw fetchError;

  const currentIds = new Set(rates.map((rate) => rate.packageId));
  const deletedIds = (existingRows ?? [])
    .map((row) => row.package_id as string)
    .filter((id) => !currentIds.has(id));

  if (deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(UPRESS_TABLE)
      .delete()
      .in('package_id', deletedIds);

    if (deleteError) throw deleteError;
  }

  return true;
}

export async function seedUpressRatesIfEmpty(rates: UpressRate[]) {
  const storedRates = await fetchUpressRatesFromSupabase();
  if (storedRates === null) return null;
  if (storedRates.length > 0) return storedRates;

  await saveUpressRatesToSupabase(rates);
  return rates;
}
