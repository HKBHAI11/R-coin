# Checkpoint 16 — TOTP confirmation account-state guard and algorithm vectors

Based on Checkpoint 15, no restart. Changes:
- Authenticator confirmation now checks ACTIVE user state before verification, and its conditional DB claim requires ACTIVE and verified email. This avoids confirmation against a suspended account and guards against account-state changes between read and claim. Not verified against a live DB.
- Added dependency-free RFC 6238 SHA-1 six-digit vectors (six timestamps), ±1 time window and malformed input regression checks in scripts/check-totp-vectors.mjs.
- Updated conditional-write source guard to reflect additional database predicates.

Verified here (Node 22):
- node scripts/check-foundation.mjs PASS
- node --experimental-strip-types scripts/check-totp.mjs PASS
- node scripts/check-totp-claims.mjs PASS
- node --experimental-strip-types scripts/check-totp-vectors.mjs PASS
- ZIP integrity checked after packaging.

Not verified: npm install, Prisma validate/generate/migrate, TypeScript builds, unit suite under tsx, database/SMTP/browser end-to-end, concurrency, rate limits, recovery and independent security audit. No public transfer route or redeemable/real-money functionality. Do not deploy.
