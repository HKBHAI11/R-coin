# Checkpoint 18 — Mobile/Codespaces handoff and automated offline gate

Based on the provided Checkpoint 17 archive. **No API, UI, Prisma schema or wallet/ledger behavior changed.** Scope remains closed-test, nonredeemable credits with no cash value.

## Added
- `scripts/check-offline.mjs`: runs all four existing dependency-free checks with one Node 22+ command; propagates failures and states what is NOT verified.
- `.github/workflows/offline-foundation.yml`: GitHub Actions executes that offline gate on source pushes and pull requests, with read-only repository permissions and no app secrets.
- `.devcontainer/devcontainer.json`: optional Node 22 Codespaces image, with API/web development ports declared. It does **not** install or configure PostgreSQL, SMTP or application dependencies.
- `docs/MOBILE_CODESPACES.md`: exact instructions to import the checkpoint's *source files* rather than leave a ZIP as the only project file.
- `.gitignore` additions for future checkpoint ZIPs and temporary extraction directory. An already tracked ZIP must be explicitly untracked with `git rm --cached` or removed in a later commit.

## Local verification (2026-10-27)
- ZIP source extracted successfully and original four offline checks re-run: PASS.
- `node scripts/check-offline.mjs`: PASS, all four checks.
- `node --check scripts/check-offline.mjs`: PASS.
- JSON and workflow YAML parsed locally: PASS.
- Attempted API `npm install` with a bounded timeout: BLOCKED by dependency-resolution timeout. No usable full dependency install, Prisma validate/generate/migrate, TypeScript build, `tsx` unit tests, DB/SMTP or browser E2E evidence. GitHub Actions has **not** been observed remotely; workflow is syntax-checked locally only.

## Next required runtime gate (Codespaces or another environment with package access)
1. Commit the extracted source, not just the ZIP. Verify offline checks on GitHub Actions.
2. `cd apps/api && npm install && npx prisma validate && npx prisma generate && npm run build && npm test`.
3. `cd apps/web && npm install && npm run build`.
4. Prepare a dedicated PostgreSQL test database and a safe test SMTP mailbox; review the Prisma migration before running it, then perform registration/email verification, TOTP/login, session, MPIN and wallet E2E tests with fake accounts.
5. Address the known CSRF, replay, recovery, rate-limit and concurrency gaps before any production consideration. Do not expose public transfers.

## Non-claims
The workflow tests only static source guards and the TOTP algorithm. No deployment, real-money use, redeemability, runtime functionality or independent security approval is claimed.
