import { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type SalesProfile = {
  id: string;
  name: string;
  sales_code: string | null;
  role: 'sales' | 'admin';
  is_active: boolean;
};

type SignUpResult = {
  user: User | null;
  needsEmailConfirmation: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const status = record.status;
    const name = record.name;
    if ((status === 500 || status === '500') && name === 'AuthRetryableFetchError') {
      return 'Supabase Auth menolak pendaftaran. Coba gunakan password yang lebih unik dan bukan password umum.';
    }
    const message = record.message || record.error_description || record.error;
    if (typeof message === 'string' && message && message !== '{}') return message;
  }
  if (error instanceof Error && error.message && error.message !== '{}') return error.message;
  if (typeof error === 'string' && error && error !== '{}') return error;
  return fallback;
}

export async function ensureSalesProfile(user: User, fallbackName?: string, fallbackSalesCode?: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const metadata = user.user_metadata as Record<string, unknown>;
  const name = String(fallbackName || metadata.name || user.email?.split('@')[0] || 'Sales').trim();
  const salesCode = String(fallbackSalesCode || metadata.sales_code || '').trim();

  const { data: existingProfile, error: readError } = await supabase
    .from('sales_profiles')
    .select('id,name,sales_code,role,is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (readError) {
    throw new Error(getErrorMessage(readError, 'Profil sales gagal dibaca.'));
  }

  if (existingProfile) {
    const shouldFillName = !existingProfile.name && name;
    const shouldFillSalesCode = !existingProfile.sales_code && salesCode;
    if (!shouldFillName && !shouldFillSalesCode) return;

    const { error: updateError } = await supabase
      .from('sales_profiles')
      .update({
        name: shouldFillName ? name : existingProfile.name,
        sales_code: shouldFillSalesCode ? salesCode : existingProfile.sales_code,
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(getErrorMessage(updateError, 'Profil sales gagal dilengkapi.'));
    }
    return;
  }

  const { error: insertError } = await supabase
    .from('sales_profiles')
    .insert({
      id: user.id,
      name,
      sales_code: salesCode || null,
      role: 'sales',
      is_active: true,
    });

  if (insertError) {
    throw new Error(getErrorMessage(insertError, 'Akun berhasil dibuat, tetapi profil sales gagal disimpan.'));
  }
}

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

export async function signUpSales(email: string, password: string, name: string, salesCode: string): Promise<SignUpResult> {
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

  if (error) throw new Error(getErrorMessage(error, 'Gagal membuat akun sales.'));

  if (data.user && data.session) {
    await ensureSalesProfile(data.user, name, salesCode);
  }

  return {
    user: data.user,
    needsEmailConfirmation: Boolean(data.user && !data.session),
  };
}

export async function signInSales(email: string, password: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(getErrorMessage(error, 'Gagal login sales.'));
  if (data.user) await ensureSalesProfile(data.user);
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
