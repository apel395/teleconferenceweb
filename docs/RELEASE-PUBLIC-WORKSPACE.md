# Frontend items 7–10

- Complaint status lookup shows chronological public responses and configured admin contact. Kanwil edits public responses and separate internal notes using the current revision. Internal notes are never rendered in public lookup.
- Guest and Kanwil chat use a room layout, latest 50 messages, deterministic cursors, older-message loading, incremental refresh, and close/reopen status. Guest tokens remain in session storage and headers, never URLs. Storage failure keeps the active room usable in memory.
- Kanwil manages FIKIH, MANASIK, DOA, FAQ and HELP categories, order, related services, source/video URLs, publishing permissions, and archive/edit revisions. Public pages show only published content. No unofficial religious material is seeded.
- Public home displays all eight public services. Navbar removes directory/education shortcuts and highlights video call. Directory remains a public service. Help, porsi lookup, official About reference and legacy URL aliases are available without login.
- Porsi lookup requires an expiring owner code for private details. Kanwil issues 1–72 hour codes from the scoped pilgrim detail. Codes and lookup results are not stored in the response cache.
- Bounded in-memory GET cache keys include the authenticated scope and server revision; at most 30 seconds and never beyond the next scheduled access transition. Mutations, refresh, logout, token/account/version changes, server revision changes and access failures invalidate it. Health, signed evidence URLs, authentication, chat, settings and public lookup bypass it.
- Auth/profile/grants/cache metadata refresh is one production API request, with compatibility fallback for the prior API. Polling pauses in hidden tabs. Cache remains off if server context cannot be validated.
- Notifications show server-scoped records and read receipts. The badge counts unread items among the latest 50, rather than claiming a global unread count. Notification links are local allowlisted resource routes.
- All role dashboards read `/workspace/dashboard`, honor individual grants and backend organization/kloter scope, show actual empty states, manifest comparisons, and separate attendance from unique pilgrims. Kanwil can expand the existing detailed journey monitoring.
- Dashboard code is lazy-loaded to reduce the public initial bundle. No schema changes or production data reset is needed.

Validation includes focused API-cache, role-panel, response/contact and cursor/authorization tests, plus Chromium desktop/mobile flows with explicit mock contracts. Browser tests do not submit production records. Production checks verify deployed commits, application readiness and public page rendering; they do not claim authenticated production E2E.
