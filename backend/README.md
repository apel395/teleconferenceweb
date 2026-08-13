# KEMENHAJ Riau Backend

FastAPI backend production foundation untuk portal layanan Haji & Umrah Provinsi Riau.

## Scope awal

- JWT authentication dan role PUBLIC/OPERATOR/ADMIN
- master layanan sesuai catatan klien
- direktori travel dengan status ACTIVE / NEEDS_VERIFICATION / PROBLEMATIC / INACTIVE
- submission/pelaporan publik dengan nomor referensi
- dashboard dan perubahan status untuk petugas
- follow-up audit trail
- metadata dokumen
- model consultation room yang provider-neutral untuk integrasi video call berikutnya

## Run locally

```bash
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Backend membutuhkan PostgreSQL melalui `DATABASE_URL`.

## Container

```bash
docker build -t kemenhaj-api .
docker run --env-file .env -p 8080:8080 kemenhaj-api
```

Untuk deployment, arahkan root service ke folder `backend/`.
