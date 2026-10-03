# KEMENHAJ Riau — Portal Layanan Haji & Umrah

Portal layanan digital Kantor Wilayah Kementerian Haji dan Umrah Provinsi Riau. Aplikasi mencakup layanan publik, pelaporan, konsultasi dan teleconference, administrasi penyelenggara, edukasi jemaah, serta modul **Pengawasan PPIU di Bandara** Phase 1 yang telah di-deploy dan masih memerlukan uji inspeksi langsung.

## Status proyek — 28 September 2026

**Produksi aktif**
- Frontend: https://teleconferenceweb.vercel.app
- Backend: https://kemenhaj-backend.onrender.com
- Frontend production branch: `main`; Vercel auto-deploy dari GitHub.
- Backend production branch: `main`; Render auto-deploy dari GitHub.
- Login dan API produksi sudah kembali berfungsi.
- Dashboard awal telah diringankan: request statistik dan meeting yang tidak diperlukan tidak lagi dijalankan saat login.
- Pelaporan dokumen dipisahkan dari alur teleconference untuk layanan yang sudah diklasifikasikan.

**Sedang dikerjakan**
- Pengawasan PPIU Phase 1 telah di-merge ke `main` dan di-deploy pada 28 September 2026.
- Backend Pengawasan memiliki draft/list/detail, checklist, submit/finalize, role `pengawas`, dan struktur attachment/storage.
- Checklist Pengawasan dikendalikan backend dan seluruh item wajib diperiksa sebelum finalisasi.
- Evidence private, signed viewing, finalisasi signatory, dan migration Supabase tersedia; validasi inspeksi langsung masih diperlukan.

## Arsitektur

```text
Browser / Mobile
       |
       v
React + TypeScript + Vite
teleconferenceweb (Vercel)
       |
       | HTTPS / JSON + Bearer JWT
       v
Node.js + Express API
kemenhaj-backend (Render)
       |
       +--------------------+
       |                    |
       v                    v
Supabase Auth         Supabase PostgreSQL
                            |
                            v
                    Supabase Storage
                    (evidence Pengawasan)
```

Frontend tidak mengakses database secara langsung. Akses data operasional melalui REST API backend. Backend menggunakan Supabase service-role client, sehingga otorisasi peran dan kepemilikan data wajib ditegakkan pada route/controller backend.

| Bagian | Repositori / Platform | Tanggung jawab |
|---|---|---|
| Frontend | [teleconferenceweb](https://github.com/apel395/teleconferenceweb) / Vercel | Public portal, auth UI, dashboards, forms, teleconference, Pengawasan UI |
| Backend | [kemenhaj-backend](https://github.com/apel395/kemenhaj-backend) / Render | REST API, auth/authorization, business rules, Supabase access |
| Database | Supabase PostgreSQL | Profiles, consultations, meetings, attendance, Pengawasan |
| Auth | Supabase Auth + application JWT | Identity + session API |
| File storage | Supabase Storage | Private evidence Pengawasan |
| Video | Google Meet (link dibuat petugas); Jitsi untuk jadwal lama | Ruang teleconference konsultasi |

## Role dan area aplikasi

| Role | Area utama |
|---|---|
| `pengguna` | layanan/konsultasi milik pengguna |
| `konsultan` | konsultasi, penjadwalan, video call |
| `admin` | ringkasan, pengajuan/laporan, konsultasi, video, administrasi |
| `pengawas` | Pengawasan PPIU Phase 1 (production) |

Public registration harus menghasilkan role `pengguna`; role petugas diberikan melalui administrasi user/backend.

## Layanan dan routing

Layanan pelaporan/dokumen tidak boleh otomatis diarahkan ke teleconference. Current production classification mencakup Pelaporan Travel Umrah, Pelaporan Jemaah Haji Khusus, Pelaporan Pemulangan, Pemulangan Jemaah Haji Reguler, Pemulangan Petugas Haji, Permasalahan Umrah & Haji Khusus, Pelaporan Manasik Kabupaten/Kota, Pengajuan Perizinan PPIU/KBIHU, Pelaporan Izin Cabang PPIU, dan List Travel Umrah.

Tanya Jawab Fikih Haji, Tutorial Manasik, dan Bacaan Doa adalah layanan edukasi/public content dan tidak diperlakukan sebagai pelaporan hanya untuk menghindari video call.

## Pengawasan PPIU di Bandara

Target workflow:

```text
Pengawasan
  -> Buat pemeriksaan
  -> Identitas PPIU + bandara + penerbangan
  -> Checklist dokumen
  -> Perlindungan/asuransi/kesehatan
  -> Bimbingan/manasik
  -> Evidence/foto
  -> Temuan + rekomendasi
  -> Identitas pengawas/pihak diawasi
  -> Finalisasi
  -> Riwayat
```

Keputusan akhir yang dimodelkan:
- `DIIZINKAN_BERANGKAT`
- `CATATAN_PERBAIKAN`
- `PENUNDAAN_PENINDAKAN`

Data Pengawasan dinormalisasi menjadi header pemeriksaan, item checklist, dan attachment. Record `FINAL` tidak boleh diedit.

## Struktur frontend

```text
src/
├── App.tsx                  # public portal + top-level routes
├── lib/api.ts               # API client, token/session storage
├── hooks/useAuth.tsx        # authentication context
├── pages/
│   ├── LiveDashboard.tsx    # operational dashboards
│   ├── PublicConsultationForm.tsx
│   └── SupervisionPages.tsx # Pengawasan Phase 1
└── dashboard.css
vercel.json                  # SPA rewrite
```

## Teknologi

React, TypeScript, Vite, React Router, Lucide React, Node.js 20+, Express, Supabase PostgreSQL/Auth/Storage, JWT, Render, Vercel, Google Meet, dan Jitsi untuk jadwal lama.

## Konfigurasi frontend

```env
VITE_API_URL=https://kemenhaj-backend.onrender.com/api
```

`VITE_API_URL` wajib tersedia pada environment build Vercel. Tanpa variabel ini client development fallback adalah `http://localhost:3000/api`.

## Pengembangan lokal

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Deployment

Push ke frontend `main` memicu deployment Vercel. `vercel.json` me-rewrite seluruh route SPA ke `/index.html`.

Push ke backend `main` memicu deployment Render. Health endpoint backend:

```text
GET https://kemenhaj-backend.onrender.com/api/health
```

Perubahan yang membutuhkan schema baru (terutama Pengawasan) **tidak boleh di-merge/deploy sebelum migration Supabase yang sesuai diterapkan**.

## Branch aktif

- Production: `main` (Pengawasan Phase 1 telah digabungkan).
- Branch pengembangan `feature/pengawasan-phase-1` tetap tersedia untuk riwayat.

## Google Meet\n\nAdmin/konsultan membuat link di Google Meet (Rapat baru → Buat rapat untuk nanti), lalu menempelkannya saat menjadwalkan. Link dibuka di tab baru dari dashboard dan halaman cek status. Jadwal Jitsi lama dapat diganti dari detail konsultasi sebelum selesai atau dibatalkan. Pembuat link masuk ke Meet dengan akun Google yang sama agar dapat mengelola peserta. Pembuatan ruang otomatis belum diaktifkan karena memerlukan OAuth Google.\n\n## Prioritas berikutnya

1. Uji end-to-end akun admin dan pengawas: checklist, foto, signed view/delete, submit, dan finalisasi.
2. Verifikasi alur meeting/video call dan status pembatalan/penyelesaian.
3. Lengkapi warning/referensi hukum, konten edukasi, direktori travel, dan penyempurnaan mobile.

## Akses admin, staf, dan perusahaan travel — 3 Oktober 2026

- Admin: menu **Akun & Travel** untuk mendaftarkan perusahaan, membuat akun staf/travel, serta mengatur keterkaitan akun travel. Admin tetap memiliki akses laporan kloter dan pengajuan PPIU.
- Staf: area `/staff` untuk laporan kepulangan kloter dan pemeriksaan awal izin PPIU.
- Perusahaan travel: area `/travel` untuk pengajuan awal PPIU dan riwayat perusahaan sendiri. Pengajuan awal bukan penerbitan izin nasional.

Peran lama untuk konsultasi dan Pengawasan tetap tersedia. Belum ada akun staf/travel produksi dan belum ada data perusahaan riil; alur login dan isolasi perusahaan perlu diuji dengan akun uji yang dibuat admin. Pengajuan PPIU publik sebelumnya tidak otomatis menjadi riwayat akun travel. Dokumen izin dan alur layanan travel lain masih tahap berikutnya.
