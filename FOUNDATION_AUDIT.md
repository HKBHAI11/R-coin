# Checkpoint 11: Foundation audit (2026-10-25)

## Verified
- Source ZIP extracted; project files retained.
- OTP invalid-attempt update now bounded to active challenge with fewer than five attempts.
- Dependency-free static foundation checker added and passed (`node scripts/check-foundation.mjs`). This is NOT a runtime/integration/security test.
- ZIP integrity checked.

## Blockers, in priority order
1. `npm install --offline` fails with ENOTCACHED for `@prisma/client` in this environment. Thus Prisma generation, TypeScript compilation, migration and runtime tests cannot be claimed passed.
2. No live PostgreSQL/SMTP sandbox; registration, email delivery and wallet creation remain unverified end-to-end.
3. TOTP setup lacks durable rate limiting, setup expiration and replay protection; recovery codes and trusted-device flow not implemented.
4. MPIN lockout update is not concurrency-safe. Transfer is deliberately not exposed publicly until fresh MPIN, auth, limits and idempotency are integrated.
5. No production-ready Redis rate limiter, comprehensive CSRF defense, full security tests or admin/KYC workflows.
6. No complete ledger reconciliation, backup/restore drill or independent review.

## Next checkpoint
Obtain a network-enabled Node.js + PostgreSQL test environment; run install, Prisma validate/generate/migrate, API and frontend builds, unit tests. Fix actual compiler/schema failures first. Then harden OTP/TOTP/session and run concurrent wallet tests. Never mark unchecked work complete.

## User requirements
No purchases or personal credentials required. If a cloud workspace is chosen later, user should configure secrets privately; never paste secrets in chat. Only synthetic KYC data.
