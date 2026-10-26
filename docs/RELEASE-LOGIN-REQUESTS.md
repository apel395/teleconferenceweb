# Login, browser cache and account request inbox

Login returns a whitelisted, current provisioned profile and server-validated role modules in one response. The frontend adopts those modules together and preloads the dashboard while credentials are checked. Older backend responses still use the validated access endpoint. A failed dashboard import/render displays an actionable recovery screen. Background permission checks remain, and every protected API still validates current permissions.

Only aggregate dashboard summaries are persisted in sessionStorage, for at most the server-supplied 30-second cache window. Reads require a fresh matching server scope/revision and valid session. Logout, account changes, mutations and access failures invalidate stored summaries. Identity, health rows, signed URLs, notifications and login responses are not persisted by this cache. Hashed static assets retain normal browser caching.

Hubungi Admin links to the public PPIU/PIHK account request form. Submitting it atomically creates notifications for Kanwil administrator/operator roles. Their dashboard has a pending inbox; notification links open the specific request. Merely opening a contact page does not create a submission. Existing-license verification, revisions, visitation and manual accreditation follow the intake release documentation; accounts are provisioned by administrators after license verification.

Release order: migrations, backend, frontend. No testing records are inserted in production. API/browser/SQL tests use fixtures. The previously supplied production administrator credential returned 401 before this change, so authenticated production login is not claimed or a password reset performed.
