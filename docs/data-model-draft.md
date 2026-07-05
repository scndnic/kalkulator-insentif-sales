# Draft Model Data

Dokumen ini adalah rancangan awal. Implementasi final bisa disesuaikan setelah tahap 1 dimulai.

## Entitas Sales

### `sales_profiles`

Menyimpan profil sales yang terhubung dengan Supabase Auth.

Kolom awal:
- `id uuid primary key` mengacu ke `auth.users.id`
- `name text`
- `sales_code text unique`
- `role text` nilai awal: `sales`, `admin`
- `is_active boolean`
- `created_at timestamptz`

## Entitas Periode

### `periods`

Mewakili bulan kerja.

Kolom awal:
- `id text primary key`, contoh `2026-01`
- `year integer`
- `month integer`
- `quarter integer`
- `status text`, contoh `open`, `locked`, `paid`
- `created_at timestamptz`

## Input Penjualan Sales

### `sales_entries`

Header input penjualan sales per bulan.

Kolom awal:
- `id uuid primary key`
- `sales_id uuid`
- `period_id text`
- `status text`, contoh `draft`, `submitted`, `locked`
- `created_at timestamptz`
- `updated_at timestamptz`

### `sales_entry_items`

Detail paket yang berhasil dijual.

Kolom awal:
- `id uuid primary key`
- `entry_id uuid`
- `package_id text`
- `quantity integer`
- `product_price integer`
- `package_snapshot jsonb`

Catatan:
- `package_snapshot` penting agar perhitungan historis tidak berubah jika admin mengubah paket di masa depan.

## Konfigurasi Insentif

### `incentive_rules`

Menyimpan aturan payout insentif.

Kolom awal:
- `id uuid primary key`
- `name text`
- `effective_from text`, contoh `2026-01`
- `current_month_percentage numeric`, contoh `80`
- `deferred_percentage numeric`, contoh `20`
- `deferred_offset_months integer`, contoh `2`
- `is_active boolean`

## Upress

### `upress_rules`

Konfigurasi upah prestasi.

Kolom awal:
- `id uuid primary key`
- `name text`
- `effective_from text`
- `quarter_mode text`, contoh `calendar_quarter`
- `is_active boolean`

### `upress_tiers`

Tabel nominal upress berdasarkan target/tier.

Kolom awal:
- `id uuid primary key`
- `rule_id uuid`
- `min_sa integer`
- `max_sa integer null`
- `amount integer`

### `upress_payout_rules`

Aturan pembayaran upress per bulan dalam kuartal.

Kolom awal:
- `id uuid primary key`
- `rule_id uuid`
- `quarter_month_index integer`, nilai 1, 2, atau 3
- `source_month_index integer`, nilai 1, 2, atau 3
- `percentage numeric`

Contoh konfigurasi triwulan:
- Bulan 1 membayar bulan 1 sebesar 50%.
- Bulan 2 membayar bulan 2 sebesar 50%.
- Bulan 3 membayar bulan 1 sebesar 50%.
- Bulan 3 membayar bulan 2 sebesar 50%.
- Bulan 3 membayar bulan 3 sebesar 100%.

## Hasil Perhitungan

### `payouts`

Header hasil payout bulanan.

Kolom awal:
- `id uuid primary key`
- `sales_id uuid`
- `period_id text`
- `total_amount integer`
- `status text`, contoh `draft`, `final`, `paid`
- `calculated_at timestamptz`

### `payout_components`

Breakdown payout.

Kolom awal:
- `id uuid primary key`
- `payout_id uuid`
- `component_type text`, contoh `incentive_80`, `incentive_20`, `upress`
- `source_period_id text`
- `percentage numeric`
- `amount integer`
- `metadata jsonb`

