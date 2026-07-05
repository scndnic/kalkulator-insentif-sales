import { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type SalesProfile = {
  id: string;
  name: string;
  sales_code: string | null;
  role: 'sales' | 'admin';
  is_active: boolean;
};

export async function getCurrentUser() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!supabase) return () => {};

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => data.subscription.unsubscribe();
}

export async function signUpSales(email: string, password: string, name: string, salesCode: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        sales_code: salesCode,
      },
    },
  });

  if (error) throw error;
  return data.user;
}

export async function signInSales(email: string, password: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOutSales() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function fetchSalesProfile(userId: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('sales_profiles')
    .select('id,name,sales_code,role,is_active')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as SalesProfile | null;
}
