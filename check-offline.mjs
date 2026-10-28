// One-command, dependency-free foundation gate. This is NOT a build or E2E test.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const major = Number(process.versions.node.split('.')[0]);
if (!Number.isInteger(major) || major < 22) {
  console.error('FAIL: Node.js 22+ is required for dependency-free TypeScript stripping.');
  process.exit(1);
}
const checks = [
  ['Foundation source guards', ['scripts/check-foundation.mjs']],
  ['TOTP algorithm round-trip', ['--experimental-strip-types', 'scripts/check-totp.mjs']],
  ['TOTP conditional-claim source guards', ['scripts/check-totp-claims.mjs']],
  ['RFC 6238 TOTP vectors', ['--experimental-strip-types', 'scripts/check-totp-vectors.mjs']],
];
let failed = false;
for (const [label, args] of checks) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    console.error(`FAIL: ${label}${result.error ? ` (${result.error.message})` : ''}`);
    failed = true;
  }
}
if (failed) {
  console.error('\nFAIL: one or more offline checks failed. Do not infer runtime readiness.');
  process.exitCode = 1;
} else {
  console.log('\nPASS: four dependency-free checks only. npm/Prisma/DB/SMTP/build/E2E/security review NOT verified.');
}
