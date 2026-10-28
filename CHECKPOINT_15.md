# Checkpoint 15 — TOTP state claim hardening

Continues Checkpoint 14. Source change: TOTP setup now conditionally claims a user with neither configured nor pending secret; a competing setup returns HTTP 409 rather than silently overwriting the pending authenticator secret. Confirmation conditionally claims the exact pending ciphertext observed, provided no configured secret exists; a stale concurrent confirmation returns HTTP 409 rather than overwriting state. Existing successful single-request response is unchanged. Pending setup retry/recovery and expiry remain missing: this is deliberately not a complete authenticator recovery solution.

## Executed checks
- `node scripts/check-foundation.mjs`: PASS (static only)
- `node --experimental-strip-types scripts/check-totp.mjs`: PASS (algorithm round-trip only)
- `node scripts/check-totp-claims.mjs`: PASS (new source guards only)
- No installed API dependencies here; Prisma validation/generation/migration, tsc, tsx unit tests, PostgreSQL, SMTP, browser and concurrent integration tests were NOT run. Security is NOT certified.

## Next verification
Install dependencies in isolated test environment; validate/generate/migrate Prisma on disposable Postgres; run API/web builds and unit tests. Test parallel TOTP setup and confirm requests with real database and dummy accounts, and registration/login/session/MPIN flows. Design explicit pending setup expiry and authenticated recovery before wider testing. No real-money/redeemable functionality or public transfer API.
