# Travel account intake and public departure lookup

Public: `/pengajuan-akun-travel` (also linked in the public service catalogue, login and contact page). Existing-license applicants provide issued permit evidence; unlicensed applicants provide legal documents and go through Kanwil review and visitation. Applicants place documents in one Google Drive folder and grant Kanwil viewing access. This release does not add binary uploads to this form.

Kanwil: sidebar **Pengajuan Akun Travel**. Review → request revisions or approve licensed applications. For unlicensed travel: review → schedule visitation → enter item scores and the A–E grade confirmed by Kanwil, with instrument/minutes reference → approve for the account process. Grades are recorded, not automatically calculated; official criteria, weights and cutoffs are still required for automatic grading. Approval does not grant a travel license. System administrators use existing organization/license verification and account creation, then link the verified matching account to the intake. Applicants never create their own operational accounts.

Public lookup: `/layanan/cek-data-jemaah`, using porsi only. Results expose year, service type, kloter and the published departure time. No name, phone, passport, medical or document data is returned. Kanwil maintains schedules in **Data Jemaah → Jadwal keberangkatan publik**. Regular and travel scopes remain separate. Existing completed non-archive source manifests work until a master participation is present; cancellations in the master cannot fall back to historical source manifests.

Evidence: complaint/supervision buttons request a fresh signed URL and open it in a new tab. A blocked popup exposes an explicit new-tab link. Google Drive links remain subject to the folder's sharing settings.

Deploy backend and apply `20261021132323_travel_intake_public_schedule.sql` before frontend. Migration creates service-only RLS tables and invoker RPCs; no production data reset or sample records. Browser scenarios use explicit mocks, SQL scenarios run in disposable CI databases. Authenticated production E2E is not claimed.
