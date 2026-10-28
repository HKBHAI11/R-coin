# Checkpoint 13 — shared DB client & foundation continuity (2026-10-26)

## Confirmed changes
- Extracted a single shared `PrismaClient` instance into `apps/api/src/db.ts` and wired `server`, `auth`, `mpin`, `session`, and `wallet` to import it. Removes accidental multi-client connection pools that were present since earlier checkpoints.
- Extended `scripts/check-foundation.mjs` with a regression guard that fails if any of those modules re-introduces `new PrismaClient`.
- Re-ran dependency-free static foundation checks and TOTP round-trip (Node strip-types). Both pass.
- Syntax-checked updated TypeScript sources with `node --experimental-strip-types --check`.

## Commands executed
- `node scripts/check-foundation.mjs`
- `node --experimental-strip-types scripts/check-totp.mjs`
- `node --experimental-strip-types --check` on updated API sources
- ZIP CRC / structure inspection of Checkpoint 12 artifact

## Still pending / NOT verified
- Network `npm install` was started but did not complete reliably in this environment (partial node_modules only). Therefore **Prisma validate/generate/migrate, TypeScript `tsc` builds, unit tests via `tsx`, and any live PostgreSQL/SMTP integration remain untested**.
- Concurrent MPIN lockout under real DB, TOTP durable rate limits / replay protection / setup expiry, recovery codes, trusted-device login, CSRF tokens, Redis rate limits, ledger transfer public API, KYC, admin, notifications.
- No public transfer endpoint. No real-money or redeemable functionality. Closed-test nonredeemable credits only.

## Tested vs untested (this checkpoint)
| Area | Status |
|------|--------|
| Static source guards (regex, imports, CAS pattern, shared db) | Passed (dependency-free) |
| TOTP algorithm round-trip (secret → code → verify) | Passed (Node strip-types, no Prisma) |
| TypeScript syntax of modified files | Passed (strip-types --check) |
| npm install / Prisma client generation | Not completed |
| API/web TypeScript build (`tsc`) | Not run |
| Unit tests (`ledger.test.ts`, `totp.test.ts` via tsx) | Not run (deps incomplete) |
| Registration, email OTP, wallet creation e2e | Untested (needs Postgres + SMTP) |
| Login / session cookie / MPIN setup e2e | Untested |
| Ledger transfer under concurrency | Untested (function exists, no public route) |

## Next action
Use a workspace with reliable network + throwaway PostgreSQL. Complete `npm install`, `npx prisma validate && generate && migrate`, run API/web builds and `npm test`. Only then attempt concurrent auth/MPIN tests. Do not deploy.
