# Frontend release: roles, accounts and journey tickets

Scope: frontend TODO items 1–3. Requires backend v7 and the pending `20261020140055_role_access_settings.sql` migration before production release.

- Access comes from `/auth/me` and `/settings/access/me`; protected routes and navigation fail closed, refresh on focus and every 30 seconds, and remount when account scope changes. API authorization remains authoritative.
- Added Operator Kanwil and Petugas Haji entry points. Petugas see their scoped assignment and minimum related pilgrim list; selection/assignment administration and the full new pilgrim/health UI remain follow-up work.
- Public signup routes redirect to Hubungi Admin. The backend rejects signup and unprovisioned provider accounts. Provider-level signup must also be disabled in Supabase Auth settings.
- Admin can edit versioned module grants and official contact; create accounts; correct institution NIB/identity; verify licenses; change roles; deactivate/reactivate accounts with an audit reason. Travel creation/login requires a 13-digit NIB and a verified current PPIU/PIHK license. Existing invalid test institutions are not silently verified.
- Travel identity, address and license number are populated from organization master data and locked. The backend also overwrites caller-supplied identity.
- Journey list remains a searchable table with collapsible filters. Closed trips have their own sidebar history. Detail is a readable record; editing and inspection are explicit actions.
- Travel submission enters PENDING_REVIEW (Menunggu Pemeriksaan). Only Operator Kanwil can submit complete inspection as SUBMITTED (Siap Berangkat). Admin/operator confirms on departure day; the clock transition still requires that confirmation.
- One ticket continues through return preparation, normal scheduled arrival, exceptional-return follow-up and closed history.
- Optional 1–30 connected flights support transit/tourism, including Turkey. Local airport dates and IANA zones convert to UTC; backend derives WIB summary and final arrival in Indonesia. Simple legacy WIB routes remain supported.
- Existing licensing reviews, complaints and materials carry the new concurrency fields. Manasik entry gains the required single-session location/time fields for backend compatibility; expanded reporting UI, manifest comparison, dashboards, FAQ/content/chat enhancements, notifications and browser Back cache remain separate TODO items 4–10.

Validation: TypeScript/Vite build; focused Node/SSR feature tests; backend policy/SQL CI; `.github/workflows/frontend-v7.yml` runs desktop/mobile Chromium flows with explicit mocked v7 responses and no production writes. These browser contract tests are distinct from production API/database smoke checks.
