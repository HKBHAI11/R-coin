# Checkpoint 14 — dependency and verification gate

This checkpoint continues from Checkpoint 13; no application behavior or security claims were changed.

## Executed here
- `node scripts/check-foundation.mjs`: PASS (source-level guards only).
- `node --experimental-strip-types scripts/check-totp.mjs`: PASS (algorithm round-trip only).
- `npm install --ignore-scripts --no-audit --no-fund --prefer-offline --fetch-retries=0` in `apps/api`: TIMED OUT in constrained environment; dependency installation not established. Ignore-scripts is only a diagnostic attempt, not a production install.
- Archive integrity: verify separately after packaging.

## Required external verification before deployment
Use an isolated test environment and dummy credentials. In `apps/api`, run `npm install`, `npx prisma validate`, `npx prisma generate`, and migrations against a disposable PostgreSQL database, then `npm run build` and `npm test`. In `apps/web`, run `npm install` and `npm run build`. With a test SMTP sink, exercise registration, OTP, wallet creation, login cookies, session revocation, MPIN lockout and concurrency, and TOTP. Record exact outputs, failures and fixes. Do not mark these as passed without execution.

## Pending
Full install, Prisma validation/generation/migrations, both builds, unit tests, database/SMTP/browser integration and security audit. No real-money, redeemable, public transfer, or production deployment support.
