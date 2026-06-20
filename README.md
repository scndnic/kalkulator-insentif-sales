# Kalkulator Insentif Sales

Aplikasi web untuk menghitung estimasi insentif sales MyRepublic berdasarkan total SA PAID per bulan.

## Fitur

- ✅ Kalkulasi insentif otomatis berdasarkan tier SA
- ✅ 18 paket internet dengan data insentif per tier
- ✅ Skema pembayaran 80% bulan ke-1 / 20% bulan ke-3
- ✅ Simulasi tambahan penjualan
- ✅ Tabel referensi insentif dengan highlight tier aktif
- ✅ Kelola data paket (tambah, edit, hapus)
- ✅ Dark mode (mengikuti preferensi sistem)
- ✅ Responsif untuk HP dan desktop
- ✅ Download PDF hasil estimasi yang rapi
- ✅ Pengaturan paket dan tabel insentif dikunci password admin sederhana
- ✅ Sinkron data paket admin antar perangkat via Supabase
- ✅ Data perhitungan hanya berlaku selama sesi halaman dan reset saat refresh

## Cara Menjalankan

```bash
npm install
npm run dev
```

Buka di browser: `http://localhost:5173`

Password admin default: `admin123`

Untuk mengganti password saat build/deploy, set environment variable:

```bash
VITE_ADMIN_PASSWORD=password-baru npm run build
```

## Setup Supabase

Data paket admin bisa disimpan di Supabase agar perubahan dari laptop dan HP sama. Jika env Supabase belum diisi, aplikasi tetap berjalan memakai penyimpanan lokal browser.

1. Buat project di Supabase.
2. Buka SQL Editor, jalankan isi file `supabase-schema.sql`.
3. Ambil Project URL dan anon public key dari Project Settings → API.
4. Set environment variable berikut di local atau Vercel:

```bash
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=anon-public-key
```

Setelah env aktif, paket admin otomatis diambil dari Supabase. Jika tabel masih kosong, aplikasi akan mengisi tabel dari data paket lokal/default saat pertama kali dibuka.

## Build Production

```bash
npm run build
```

## Deploy ke Vercel

1. Push project ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Import repository → pilih "Vite" sebagai framework
4. Deploy

Atau via Vercel CLI:
```bash
npm install -g vercel
vercel
```

## Struktur Project

```
src/
├── components/
│   ├── Header.tsx          # Header + navigasi
│   ├── SummaryCards.tsx    # 4 kartu ringkasan
│   ├── AddSaleForm.tsx     # Form tambah penjualan
│   ├── SalesTable.tsx      # Tabel rincian + edit kuantitas
│   ├── PaymentBreakdown.tsx # Skema 80/20
│   ├── TargetSimulator.tsx  # Simulasi tambahan SA
│   ├── IncentiveReference.tsx # Tabel referensi accordion
│   ├── PackageManager.tsx  # Modal kelola paket
│   ├── ConfirmDialog.tsx   # Dialog konfirmasi
│   └── EmptyState.tsx      # State kosong
├── data/
│   └── incentives.ts       # Data awal 18 paket
├── utils/
│   ├── calculateIncentive.ts
│   ├── formatCurrency.ts
│   └── getTier.ts
└── types/
    └── incentive.ts
```

## Logika Tier

| Total SA | Tier |
|----------|------|
| 0–5 | Tier 0–5 |
| 6–10 | Tier 6–10 |
| 11–14 | Tier 11–14 |
| ≥15 | Tier ≥15 |

Tier ditentukan berdasarkan **total semua SA**, bukan per paket individual.

## Catatan Data

Beberapa nominal insentif berasal dari foto materi presentasi yang kurang tajam. Gunakan fitur **Kelola Data Paket** untuk menyesuaikan nominal yang tepat sesuai materi resmi.
