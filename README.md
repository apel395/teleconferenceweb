# KEMENHAJ Riau — Purwarupa Layanan Konsultasi

Purwarupa frontend interaktif untuk layanan konsultasi Haji dan Umrah di tingkat provinsi. Aplikasi memperagakan situs informasi publik, permohonan dan penjadwalan konsultasi, dashboard pengguna, dashboard konsultan, dashboard administrator, serta ruang pertemuan daring.

Ruang lingkup purwarupa juga mencakup:

- register permohonan layanan
- register penyelesaian layanan
- monitoring ketepatan waktu
- bukti penyelesaian pelayanan
- rekap waktu penyelesaian
- dokumentasi pelayanan dan kehadiran pertemuan

## Teknologi

- React
- Vite
- TypeScript
- React Router
- Lucide React
- CSS responsif dengan design tokens

## Instalasi

Persyaratan: Node.js 20 atau yang lebih baru.

```bash
npm install
```

## Pengembangan lokal

```bash
npm run dev
```

## Build produksi

```bash
npm run build
```

Hasil build tersedia di direktori `dist` dan dapat diperiksa secara lokal dengan:

```bash
npm run preview
```

## Deployment ke Vercel

1. Impor repository GitHub ini ke Vercel.
2. Pilih **Vite** sebagai Framework Preset.
3. Gunakan `npm install` sebagai Install Command.
4. Gunakan `npm run build` sebagai Build Command.
5. Gunakan `dist` sebagai Output Directory.
6. Deploy tanpa environment variable tambahan.

Konfigurasi rewrite SPA berada di `vercel.json`, sehingga React Router tetap bekerja ketika halaman seperti `/dashboard`, `/konsultan`, atau `/meeting/demo` dibuka secara langsung.

## Batasan purwarupa

Seluruh data dan interaksi bersifat demonstrasi. Telekonferensi, kamera, mikrofon, autentikasi, unggah dokumen, notifikasi, penyimpanan data, dan fungsi backend tidak benar-benar dijalankan.

Purwarupa ini merupakan layanan konsultasi dan **tidak melakukan persetujuan daring, penerbitan izin, atau keputusan administratif secara online**. Tindak lanjut resmi tetap dilakukan di kantor apabila diperlukan.
