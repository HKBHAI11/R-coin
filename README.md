# R-Coin — checkpoint 17
Closed-test nonredeemable credits only; no cash value. NOT production-ready.

## Run locally
- Node 20+, PostgreSQL 16, SMTP credentials.
- `cd apps/api && cp .env.example .env && npm install && npx prisma migrate dev --name init && npm run dev`
- `cd apps/web && npm install && npm run dev`
- Set WEB_ORIGIN and SMTP settings in API environment; use VITE_API_URL for a remote API.
- The server stores OTP HMAC digests, not plaintext codes; verified registration provisions an empty wallet.
- Support submission returns a tracking code; ticket lookup and admin handling are not implemented.
- No real identity documents or real funds should be submitted to this checkpoint.
See docs/REQUIREMENTS.md and docs/PROGRESS.md for full scope and outstanding work.

## Checkpoint 05
Added `POST /auth/totp/setup`, `/auth/totp/confirm`, `/auth/login`, `GET /auth/me`, and `POST /auth/logout`. Set `TOTP_ENCRYPTION_KEY` to 64 hex characters representing 32 random bytes. Apply Prisma migrations before running. Authenticator setup returns a secret once for manual addition to an authenticator; handle it as highly sensitive. This is an incomplete security foundation, not a production-ready wallet.

### Checkpoint 06
`POST /mpin/setup` requires a logged-in session, password, current TOTP, matching six-digit MPIN fields and an Origin matching WEB_ORIGIN. `POST /mpin/verify` checks a configured MPIN with a basic lockout. Neither endpoint sends credits. Run Prisma migrations and comprehensive security tests before deployment.

## Checkpoint 07
The web UI now includes registration, email verification, authenticator setup and confirmation, login, MPIN setup, signed-in account overview and logout. Configure `VITE_API_URL`, `WEB_ORIGIN`, SMTP, PostgreSQL, and `TOTP_ENCRYPTION_KEY` before testing. Never use real user data in development. No live transfers are enabled.

## Checkpoint 12 validation (not production readiness)
From the `r-coin` folder run `node scripts/check-foundation.mjs` and, on Node 22+, `node --experimental-strip-types scripts/check-totp.mjs`. See `docs/CHECKPOINT_12.md` for outstanding dependency, Prisma, database and security tests. `.env` is intentionally ignored by Git; keep all credentials out of the repository.

## Checkpoint 13
Shared Prisma client (`apps/api/src/db.ts`). Static foundation + TOTP algorithm checks pass. Full dependency install, Prisma migration, builds and database integration tests are still required before any deployment claim.

Latest verification status: see `docs/CHECKPOINT_14.md`. Static checks are not evidence of end-to-end security or deployment readiness.

Checkpoint 15: see `docs/CHECKPOINT_15.md` for conditional TOTP setup/confirm claims, verification scope and pending integration work.

Checkpoint 16: see `docs/CHECKPOINT_16.md`. Run `node --experimental-strip-types scripts/check-totp-vectors.mjs` for the added algorithm vectors. This is not a deployment/security sign-off.

Checkpoint 17: Independent audit. Session cookie parsing consolidated; foundation guards updated. All dependency-free checks PASS. npm/Prisma/DB/unit/E2E remain BLOCKED. See `docs/CHECKPOINT_17.md`. Do not deploy.

## Checkpoint 18 — Codespaces handoff (no runtime feature claim)
See `docs/CHECKPOINT_18.md` and `docs/MOBILE_CODESPACES.md`. Once source is extracted into the repository, run `node scripts/check-offline.mjs` on Node 22+. GitHub Actions also runs this **offline-only** gate after source is committed; it does not validate npm install, Prisma, DB/SMTP, UI integration, or deployment safety.
