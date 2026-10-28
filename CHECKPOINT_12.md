# Checkpoint 12 — source-level foundation repairs (2026-10-26)

## Confirmed changes
- Opened and ZIP-integrity-checked the actual Checkpoint 11 artifact (33 entries).
- Fixed double-escaped six-digit regex literals in TOTP verification, authenticator input, and MPIN setup/verification. The previous code rejected ordinary numeric codes. A pre-fix TOTP round trip returned false; the post-fix Node runtime round trip passes.
- Removed duplicate `requireTrustedOrigin` import from `auth.ts` (a TypeScript compilation blocker).
- Changed MPIN verification failure/success state updates to compare-and-swap using observed failure count, hash and lock state, with bounded retry on concurrent updates. This is a source-level mitigation, not a DB-verified concurrency claim.
- Added `.gitignore` to exclude `.env` and generated artifacts, static regression guards, and a dependency-free TOTP runtime check.

## Commands executed
- `node scripts/check-foundation.mjs` (static source checks)
- `node --experimental-strip-types scripts/check-totp.mjs` (TOTP runtime round trip, Node 22)
- `node --experimental-strip-types --check apps/api/src/mpin.ts` and `.../auth.ts` (syntax only)
- `npm install --offline --ignore-scripts --no-audit --no-fund --package-lock=false` in apps/api: FAILED with ENOTCACHED for @prisma/client.
- ZIP CRC check.

## Still pending / NOT verified
- Network-enabled `npm install`, Prisma schema validation/client generation/migration, API/web TypeScript builds, PostgreSQL/SMTP integration and concurrent MPIN tests.
- TOTP durable throttling, expiry/replay protection, recovery codes, session/CSRF review, comprehensive ledger reconciliation, admin/KYC and security review.
- No public transfer API, no real funds, no real identity documents. Closed-test nonredeemable credits only.

## Next action
Use a network-enabled development workspace with a throwaway PostgreSQL database and synthetic data. Install dependencies and run Prisma validate/generate/migrate, both builds, tests and concurrency checks. Do not deploy or claim production security.
