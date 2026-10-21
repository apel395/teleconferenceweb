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


## Tiket Perjalanan Umrah — 20 Oktober 2026

Menu **Tiket Perjalanan Umrah** menggantikan layanan keberangkatan/kepulangan Umrah terpisah. Satu tiket digunakan sampai selesai. Detail menampilkan data keberangkatan dan kepulangan bersama; riwayat tersedia pada menu sidebar tersendiri. Laporan kepulangan kloter haji tetap layanan tersendiri.

Status: **Draft → Siap Berangkat → Sudah Berangkat → Kepulangan / Kepulangan dengan Catatan → Sudah Pulang**. Submit menjadikan Siap Berangkat. Kanwil memeriksa dan mengonfirmasi pada hari keberangkatan dalam WIB; status berubah setelah konfirmasi dan jadwal keberangkatan tercapai. Travel menyiapkan serta mengirim jadwal tiba; kondisi normal otomatis ditutup pada jadwal tiba. Catatan kendala mengharuskan tindak lanjut/konfirmasi tiba secara eksplisit. Catatan dan kedua formulir tetap tersimpan.

Identitas travel diambil dari akun. Admin memiliki pencarian tiket pada ringkasan. Daftar tiket dilengkapi pencarian dan filter status, maskapai, rute keberangkatan. Form menyediakan dropdown maskapai/rute dengan opsi lainnya dan nama petugas sebanyak jumlah petugas. Dokumen menggunakan link folder Google Drive.

Memerlukan backend tiket perjalanan dan dua migration pada README backend. Validasi lokal: TypeScript/Vite build dan 49 pengujian backend. Uji interaktif produksi akun admin/travel tetap diperlukan.


## Portal operasional Riau — 20 Oktober 2026

Katalog publik hanya Pengaduan Jemaah, Direktori PPIU/PIHK Riau, Fikih Haji, Tutorial Manasik, Bacaan Doa, dan Minta Video Call. Keberangkatan/kepulangan digabung menjadi Tiket Perjalanan Jemaah di dashboard Kanwil dan travel. Menu pelaporan haji khusus, pemulangan terpisah, dan pemulangan petugas dihapus. Pemulangan Haji Reguler hanya Kanwil. Manasik hanya Kanwil, Kemenhaj kabupaten/kota, dan KBIHU.

Area akun: /admin (Kanwil), /kabkota, /travel (PPIU/PIHK), /kbihu. Halaman Profil & Identitas menampilkan peran/organisasi dan isian nama, telepon, alamat, jabatan, nomor pegawai opsional. Kanwil mengelola organisasi, akun, peran, serta verifikasi izin; pendaftaran mandiri travel tidak memverifikasi izin.

Pengaduan dibagi Umrah/Haji Khusus/Haji Reguler. Umrah/Haji Khusus memilih travel terverifikasi dari dropdown atau mengisi travel tidak terdaftar secara manual. Haji Reguler tidak meminta data travel/paket. Direktori hanya menampilkan organisasi Riau yang izinnya telah diverifikasi dan aktif.

Perizinan menyediakan form organisasi lengkap serta daftar/detail/review/revisi. Field perizinan mengikuti screenshot Google Form yang diberikan. Manasik mempunyai laporan, link dokumen, pemeriksaan Kanwil dan perbaikan organisasi pemilik. Fikih/Manasik/Doa menampilkan materi sumber dan video serta chat privat dengan petugas Kanwil. Materi dan chat masuk dikelola dari dashboard Kanwil. Video call tetap melalui permintaan konsultasi dan Google Meet.

Memerlukan backend riau-portal-v3 dan migration 20261020120533_portal_operational_redesign.sql. Data direktori harus diverifikasi dari sumber izin resmi oleh Kanwil; data testing tidak diterbitkan sebagai penyelenggara berizin.


## Detail tiket dan form perizinan — 20 Oktober 2026

Tiket menampilkan halaman detail dengan kartu ringkasan, tahap perjalanan, penerbangan, tabel checklist, dokumen, identitas, tombol tindakan dan timeline. Tidak ada form yang dinonaktifkan pada tampilan awal. Edit tiket dan pemeriksaan Kanwil dibuka secara eksplisit; alasan koreksi serta rincian sebelum/sesudah terlihat pada riwayat. Travel dapat membuka kembali pengajuan sebelum keberangkatan dengan Perbaiki pengajuan. Tiket selesai dan data keberangkatan setelah waktu berangkat terkunci. Koreksi sebelum waktu berangkat membatalkan konfirmasi lama sehingga perlu dikonfirmasi lagi.

Form perizinan disesuaikan dengan screenshot Google Form: bidang usaha, surat permohonan, notaris, Kemenkumham, SKDU, bank garansi dan contact person ditambahkan. Penanda wajib mengikuti screenshot, dengan berkas berupa satu folder Google Drive. Field administrasi tambahan ditempatkan di bagian opsional.

Referensi desain: dashboard.haji.go.id (navigasi operasional) dan tampilan detail work item Jira Service Management (status, konteks, tindakan dan aktivitas). Validasi: 12 tes frontend, 71 tes backend, dan npm run build.

### Tabel perjalanan, jadwal dan riwayat

Menu Perjalanan Jemaah hanya tabel dengan pencarian, filter status/maskapai/rute yang dapat dilipat, dan paginasi 25 tiket. Riwayat Perjalanan di sidebar Kanwil/travel berisi tiket CLOSED; tiap detail riwayat juga mencatat aktor dan perubahan. Detail aktif tidak memiliki tab pilihan keberangkatan/kepulangan/riwayat.

Jam keberangkatan dan jam tiba wajib pada pengiriman, menggunakan WIB (UTC+7). Timer tampilan 30 detik memperbarui detail hanya di luar editor sehingga input belum tersimpan tidak ditimpa. Jadwal adalah acuan status, bukan data penerbangan langsung.

Memerlukan backend riau-portal-v5-scheduled-journeys dan migration scheduled_journey_status. Uji terbatas pada fitur berubah: 31 tes API tiket, 5 tes rendering frontend, verifikasi transisi SQL dengan rollback, dan build.

## Ringkasan Monitoring Kanwil — 20 Oktober 2026

Ringkasan /admin memakai pola dashboard.haji.go.id: filter ringkas, total jemaah besar, grafik maskapai, rekap PPIU/PIHK berdampingan, seri bulanan, dan distribusi status tiket. Data berasal dari aplikasi Riau. Filter utama tahun/jenis/travel, filter lanjutan maskapai/bandara/rute/rentang tanggal dapat dilipat, diterapkan lewat tombol Terapkan dan disimpan di URL. Tombol reset, refresh manual, pembaruan tiap menit saat tab terlihat, pencarian tiket, dan pencarian/paginasi rekap travel tersedia.

Grafik dan tabel memiliki label nilai dan data bulanan dapat dibuka sebagai tabel. Ringkasan tindak lanjut layanan diberi label seluruh periode dan tidak mengikuti filter perjalanan. Form/peran lain tetap seperti semula; statistik Kanwil tidak dibuka untuk publik atau akun organisasi lain. Memerlukan backend riau-portal-v6-monitoring-dashboard dan migration kanwil_monitoring_dashboard. Validasi perubahan hanya dashboard: 5 tes API, 4 tes rendering, SQL >1100 tiket dengan rollback, dan build.



## Frontend items 4–6

Data jemaah / manifest tiga tahap, pengajuan perubahan dan review Kanwil, penugasan petugas, laporan kondisi, manasik multisesi, serta perizinan lengkap tersedia pada dashboard sesuai hak akses. Lihat [release notes](docs/RELEASE-PILGRIMS-STAFF-MANASIK.md) untuk alur, kompatibilitas data sumber lama, dan validasi.
