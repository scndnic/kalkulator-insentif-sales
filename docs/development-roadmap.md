# Roadmap Pengembangan

Dokumen ini menjaga pengembangan setelah versi stabil tetap bertahap dan aman.

## Baseline Stabil

- Tag lokal: `v1.0.0-stable`
- Commit baseline: `dc4dadb`
- Tujuan baseline: titik balik aman sebelum fitur akun sales, histori input, dan upah prestasi.

## Prinsip Pengembangan

- Fitur sales dan fitur admin dipisahkan jelas.
- Data perhitungan sales yang sudah tersimpan tidak boleh berubah diam-diam ketika aturan admin diubah.
- Setiap perubahan aturan payout perlu punya periode berlaku.
- Production hanya menerima fitur yang sudah lolos build dan uji alur utama.
- Supabase menjadi sumber data online; browser cache hanya fallback.

## Tahap 1 - Fondasi Akun dan Data Historis

Tujuan:
- Sales dapat daftar/login.
- Sales dapat menyimpan input penjualan per bulan.
- Admin tetap dapat mengelola paket dan tabel insentif.

Output:
- Supabase Auth aktif untuk sales.
- Tabel profil sales.
- Tabel periode bulanan.
- Tabel input penjualan sales per bulan.
- Tampilan sales untuk melihat dan mengedit input bulan berjalan.

File pendukung:
- `supabase-growth-schema.sql` sebagai draft schema executable untuk akun sales, periode, input penjualan, payout rules, dan upress.

Catatan keamanan:
- Sales hanya boleh membaca/mengubah datanya sendiri.
- Admin punya akses terpisah untuk konfigurasi dan koreksi.

## Tahap 2 - Mesin Payout Insentif

Tujuan:
- Sistem menghitung payout bulan berjalan dari beberapa komponen.

Komponen awal:
- Insentif bulan berjalan, contoh 80%.
- Sisa insentif dari periode sebelumnya, contoh 20%.
- Semua aturan harus disimpan sebagai konfigurasi dengan tanggal/periode berlaku.

Output:
- Tabel aturan payout insentif.
- Tabel hasil perhitungan payout bulanan.
- Ringkasan payout untuk sales.
- Panel admin untuk mengubah persentase dan jeda pembayaran.

## Tahap 3 - Upress Per Triwulan

Tujuan:
- Menambahkan upah prestasi per kuartal/triwulan.

Konsep awal:
- Kuartal berisi 3 bulan.
- Upress bisa dibayarkan sebagian di bulan 1 dan 2, lalu direkonsiliasi di bulan 3.
- Contoh:
  - Januari: upress Januari 50%.
  - Februari: upress Februari 50%.
  - Maret: sisa Januari 50%, sisa Februari 50%, dan Maret 100%.

Output:
- Tabel konfigurasi kuartal.
- Tabel tier upress.
- Tabel payout upress.
- Tampilan breakdown upress di sisi sales.
- Panel admin untuk setting kuartal, tier, dan persentase pembayaran.

## Tahap 4 - Admin Lanjutan

Tujuan:
- Admin dapat mengatur semua logika tanpa edit kode.

Area konfigurasi:
- Produk/paket.
- Tabel insentif.
- Tier SA.
- Persentase payout insentif.
- Jeda pembayaran sisa insentif.
- Tabel upress.
- Kuartal/triwulan.
- Status periode: draft, terkunci, dibayarkan.

## Tahap 5 - Audit, Backup, dan Rekonsiliasi

Tujuan:
- Perubahan data penting bisa dilacak dan dipulihkan.

Output:
- Audit log perubahan admin.
- Export/import konfigurasi.
- Snapshot aturan per periode.
- Lock periode setelah closing.
- Koreksi manual dengan catatan alasan.
