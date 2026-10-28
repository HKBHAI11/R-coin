# Checkpoint 05 — October 25, 2026
Preserved Checkpoint 04 and added password + authenticator setup/confirmation, AES-256-GCM encrypted TOTP storage (environment key), password+TOTP login, single-active-session revocation, httpOnly sameSite session cookie, /auth/me and /auth/logout, session database model and TOTP unit test.
Security limitations: current login requires TOTP every time (stricter than planned trusted-device login). TOTP setup has no expiration and needs stronger rate limiting/replay prevention and recovery codes. CSRF protection for state-changing session routes and secure session/device policy require further work. No public transfer endpoint yet. Database/SMTP integration untested. Do not deploy.
Next: MPIN, recovery, session middleware, CSRF protection, user-facing auth UI, migrations and end-to-end tests.

## Checkpoint 06
Added authenticated MPIN setup and verification endpoints, separate Argon2id MPIN hash, five-attempt temporary lockout, server-side session middleware and strict Origin check on MPIN routes. MPIN verification intentionally does not authorize a transfer. Pending: concurrency-safe lockout, recovery, fresh MPIN verification inside atomic transfer, production-grade rate limiting, CSRF hardening and full integration tests. No live-money support.

## Checkpoint 07
Added English-only frontend screens for authenticator setup/confirmation, password + TOTP sign-in, signed-in account overview, MPIN setup, and logout. Enabled credentialed CORS for session cookie exchange and strict Origin checking on logout. Account overview intentionally does not show fabricated balance or enable transfers.

Validation: ZIP integrity checked. npm dependency installation timed out, so TypeScript build, DB migrations and browser integration have NOT passed. Needs CSRF audit, trusted-device login, recovery codes, stronger TOTP anti-replay/rate limits and backend integration testing before deployment.

## Checkpoint 08 — authenticated wallet overview
- Added GET /wallet/overview protected by active server-side session; returns persisted wallet ID and exact balance as a decimal string (BigInt-safe), KYC and account status; no-cache response.
- Added account overview frontend fetching persisted data, show/hide balance and wallet ID copy; does not invent pending credit or received totals.
- Added Origin check to cookie-authenticated logout.
- Limitations: balance currently represents integer credit units in the database; final minor-unit denomination policy must be fixed before transfers are exposed. Clipboard requires supported secure browser context. Account recovery, robust CSRF coverage, trusted device handling, security audit, and end-to-end database tests remain outstanding. Do not deploy as a real-money wallet.

## Checkpoint 09 — foundation repair
- Added missing Prisma User ↔ Wallet relation required for schema validity.
- On email verification, create wallet ledger account in the same database transaction.
- Added trusted-origin validation for cookie-based logout.
- Remaining blockers: install dependencies, prisma validate/generate/migrate, TS build, live DB tests, email retry/recovery, TOTP anti-replay and rate limiting, admin, KYC, transfer integration.
- Do not deploy or treat closed-test credits as money.

## Checkpoint 10
Pending blockers prioritized. Fixed two conditional-claim races. Offline npm install failed due to missing cached dependency; build/tests unverified. See PENDING_FEATURES.md.

## Checkpoint 11 — Foundation audit
Paused new feature development to check pending blockers. Added bounded invalid OTP attempt update, a dependency-free static foundation check, and `docs/FOUNDATION_AUDIT.md`. Static checks passed. Offline npm installation failed due to uncached @prisma/client; no runtime or integration tests passed. See audit for prioritized work.

## Checkpoint 12 — 2026-10-26
Repaired double-escaped six-digit regex literals that rejected valid authenticator/MPIN input, removed duplicate auth import, added MPIN compare-and-swap updates, regression guards and .gitignore. See CHECKPOINT_12.md for verified commands and blockers. No DB integration or public transfers.

## Checkpoint 13 — 2026-10-26
Centralized PrismaClient into `src/db.ts` for all route modules to avoid multi-instance pools. Extended static foundation guards. Static checks and TOTP algorithm round-trip still pass. npm install / Prisma / builds / DB integration remain unverified in this environment. No public transfers, no real-money features. See CHECKPOINT_13.md.

## Checkpoint 14 — verification gate
Re-ran dependency-free foundation and TOTP checks successfully. Attempted API dependency installation, but it timed out; Prisma, builds, unit tests and DB/browser integration remain unverified. See CHECKPOINT_14.md. No app behavior changed.

## Checkpoint 15
TOTP setup and confirmation now use conditional database updates to prevent overwriting an existing/pending secret or accepting a stale pending secret. Added `scripts/check-totp-claims.mjs` source regression checks. Foundation, dependency-free TOTP round-trip and new source guard passed locally. No full dependencies, database, build, unit, concurrency or E2E verification established; see `docs/CHECKPOINT_15.md`.

## Checkpoint 16
TOTP confirmation now requires ACTIVE and verified account state in its conditional database claim. Added six RFC 6238 SHA-1 algorithm vectors and boundary/invalid-code tests. Dependency-free checks passed. Database, TypeScript builds, end-to-end and concurrency testing remain pending; see CHECKPOINT_16.md.

## Checkpoint 17 — Independent audit
Independent technical audit of Checkpoint 16. Consolidated session cookie parsing and token hashing into shared helpers from `session.ts` (removed local cookie parser and aligned `/auth/me` expiry check). Extended foundation source guards. All dependency-free static / TOTP algorithm checks PASS. Full npm install, Prisma, TypeScript builds, unit tests, PostgreSQL/SMTP integration, registration/login/TOTP/MPIN/wallet end-to-end, and concurrency stress remain BLOCKED by environment (no reliable package resolution, no PostgreSQL). No public transfer route, no redeemable value. See CHECKPOINT_17.md. Do not deploy.

## Checkpoint 18 — 2026-10-27
Added mobile Codespaces source-import instructions, optional Node 22 devcontainer config, single-command offline test gate and GitHub Actions offline-only workflow. No API/UI/schema/ledger behavior changed. Offline checks pass locally. Full npm install timed out; Prisma/build/unit/DB/SMTP/E2E/security checks remain unverified. See CHECKPOINT_18.md. No public transfers, no redeemable value.

## Checkpoint 19
Read-only runtime prerequisites preflight added; see `docs/CHECKPOINT_19.md`. No runtime or security validation claimed.

## Checkpoint 20
Added manual credit-request Prisma data foundation only; see `docs/CHECKPOINT_20.md`. Approval and issuance routes are pending.

## Checkpoint 21
Authenticated user credit request submit/list API foundation. See `docs/CHECKPOINT_21.md`; database and end-to-end testing pending.

## Checkpoint 22
Added API-backed user request/history UI and animated depth CSS; see `docs/CHECKPOINT_22.md`. Runtime and security verification pending.

## Checkpoint 23
Admin review source added; database/build/security tests pending. See docs/CHECKPOINT_23.md.
