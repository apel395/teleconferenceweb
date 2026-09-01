# KEMENHAJ Riau — Layanan Konsultasi

Portal layanan konsultasi Haji dan Umrah di tingkat provinsi. Aplikasi menampilkan situs informasi publik, permohonan dan penjadwalan konsultasi, dashboard pengguna, dashboard konsultan, dashboard administrator, serta ruang pertemuan daring.

Lingkup layanan mencakup:

- register permohonan layanan
- register penyelesaian layanan
- monitoring ketepatan waktu
- bukti penyelesaian pelayanan
- rekap waktu penyelesaian
- dokumentasi pelayanan dan kehadiran pertemuan

## Arsitektur

Aplikasi terdiri dari dua bagian:

| Bagian | Repositori | Hosting |
|---|---|---|
| Frontend (React/Vite) | [teleconferenceweb](https://github.com/apel395/teleconferenceweb) | Vercel |
| Backend (Node.js/Express) | [kemenhaj-backend](https://github.com/apel395/kemenhaj-backend) | Render |
| Database | Supabase (PostgreSQL) | Supabase |

## Teknologi

**Frontend**
- React
- Vite
- TypeScript
- React Router
- Lucide React
- CSS responsif dengan design tokens

**Backend**
- Node.js
- Express
- Supabase (PostgreSQL + Auth)
- JWT authentication

## Instalasi

Persyaratan: Node.js 20 atau yang lebih baru.

### Frontend

```bash
cd kemenhaj-frontend
npm install
cp .env.example .env   # atur VITE_API_URL sesuai backend
npm run dev
```

### Backend

```bash
cd kemenhaj-backend
npm install
cp .env.example .env   # isi kredensial Supabase
npm run dev
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
6. Atur environment variable `VITE_API_URL` dengan URL backend yang sudah di-deploy.

Konfigurasi rewrite SPA berada di `vercel.json`, sehingga React Router tetap bekerja ketika halaman seperti `/dashboard`, `/konsultan`, atau `/meeting/demo` dibuka secara langsung.

## Deployment Backend ke Render

1. Impor repository [kemenhaj-backend](https://github.com/apel395/kemenhaj-backend) ke Render (gunakan Blueprint `render.yaml`).
2. Atur environment variable:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
3. Render otomatis men-deploy setiap push ke branch `main`.

## Database (Supabase)

Skema database tersedia di `supabase/schema.sql`. Jalankan di **Supabase SQL Editor** pada proyek yang berjalan di region **Southeast Asia (Singapore)**.
