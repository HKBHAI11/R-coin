# Release blockers and pending work — Checkpoint 17

## Addressed in source (static)
- Concurrent email verification claim under serializable transaction (earlier).
- MPIN setup conditional update + compare-and-swap lockout (Checkpoint 12).
- Double-escaped six-digit regex rejection of valid codes (Checkpoint 12).
- Shared PrismaClient instance across API modules (Checkpoint 13).
- ZIP integrity and dependency-free foundation/TOTP guards.
- TOTP setup/confirm conditional claims + ACTIVE-state guard (15/16).
- Shared sessionToken / tokenHash usage and consistent /me expiry (Checkpoint 17).

## Still pending; NOT marked complete
- Reliable `npm install`, Prisma validate/generate/migrate, TypeScript builds for API and web.
- PostgreSQL + SMTP sandbox: registration, OTP delivery, wallet + ledger account creation e2e.
- Unit tests under `tsx` (ledger balance rules, TOTP) and concurrent MPIN lockout under a real DB.
- TOTP anti-replay, setup expiry, durable rate limits, recovery codes, trusted-device password-only re-login.
- CSRF beyond Origin check, Redis-backed rate limits, session revocation policy review.
- Public transfer route only after fresh MPIN inside the same atomic transfer, limits, idempotency.
- KYC document flow, admin RBAC, credit issuance UI, notifications, history/receipts, support replies.
- Accessible UI polish, reduced-motion, independent security review.

Do not deploy or enable live transfers. R-Coin is nonredeemable closed-test credits only.

## Checkpoint 18 follow-up
- Commit extracted project source to private GitHub repository; a ZIP alone is not a runnable Codespace project.
- Observe GitHub Actions offline-only workflow on actual push (local YAML syntax checked, remote run not observed).
- Then retry dependency install / Prisma / builds / unit tests in Codespaces with working registry access; use separate test PostgreSQL and SMTP for E2E. No production deployment.
