# Frontend items 4–6

## Data jemaah and manifests

- All permitted roles open their scoped data at `<dashboard>/jemaah`. Kanwil can add records; institution users request corrections, replacements, cancellations or transfers. Kanwil review applies changes with optimistic versions and retains history. A replacement retains the porsi while creating a new identity.
- Three immutable manifest stages: PRE, DEPARTURE and RETURN. Kanwil downloads .xls/.xlsx templates, previews binary Excel uploads (16 MB / 10,000 rows maximum), checks row errors and identity conflicts, and explicitly confirms before committing. Non-Kanwil reads/exports are scoped by the backend.
- Compare two snapshots from the same year and organization; show additions, removals, identity, status and group differences. Export uses one sheet per kloter and current filters. Leading porsi zeros remain text.
- Existing imported source manifests remain available in a separate Kanwil-only tab. They are not silently overwritten or automatically promoted to a new snapshot. Import PRE when preparing the new master.

## Staff and condition reports

- Admin verifies central selection, sets time-bounded kloter assignments, chooses report/detail-health permissions and revokes assignments without deleting history. Account creation remains in Accounts & Organizations.
- Staff retain their legacy-assignment scoped view and can open the scoped master and condition reports. Health reports reference master participation IDs; a PRE manifest must exist for reporting. A revoked/expired assignment or withdrawn selection is rejected by the backend on the next read/write.
- Condition categories: ill, admitted, assistance, referral, deceased, other. Record WIB event time, location, details, initial action and optional Drive evidence. Detail-authorized accounts add status and response history using current revision.
- Reference endpoints added for private organization options, admin staff/selection/group metadata, and Kanwil licensing organizations. No schema or role-ceiling changes.

## Manasik and licensing

- 1–100 sessions per report, each with district, optional/required subdistrict by category, venue, full address, trainer, WIB times, attendance and Drive documentation. Attendance totals are distinct from unique participants; do not infer uniqueness from repeated attendance counts.
- Full PPIU / PIHK / KBIHU / PPIU-branch form, visible required 13-digit NIB, trusted organization identity, complete read view, private fresh detail/history retrieval, safe Drive link in a new tab, revision/resubmission and Kanwil review. Approval here does not automatically verify a travel license.

## Validation

- TypeScript/Vite build; focused component/normalization tests; Chromium contracts for role-scoped changes/review, manifest preview/confirmation/comparison, staff verification/assignment/revocation, health redaction/report/followup, mobile multisession manasik and licensing revision.
- Browser contracts mock backend responses and do not write production data. Backend tests cover the new metadata endpoint authorization/scoping; existing Excel/parser and SQL suites remain in CI.
- Finalized snapshot differences still require human review where identity differs. No claim of automatic document authenticity verification.
