import {readFileSync,existsSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const schema=read('apps/api/prisma/schema.prisma');
const server=read('apps/api/src/server.ts');
const ledger=read('apps/api/src/ledger.ts');
const auth=read('apps/api/src/auth.ts');
const session=read('apps/api/src/session.ts');
const mpin=read('apps/api/src/mpin.ts');
const wallet=read('apps/api/src/wallet.ts');
for(const name of ['User','Wallet','LedgerAccount','LedgerTransaction','LedgerEntry','AuthSession','EmailChallenge'])assert.ok(schema.includes('model '+name+' {'));
assert.match(schema,/balanceMinor BigInt/);
assert.match(server,/TransactionIsolationLevel.Serializable/);
assert.match(server,/attempts:\{lt:5\}/);
assert.match(server,/emailVerifiedAt:null/);
assert.match(ledger,/assertBalanced\(\[-args.amountMinor,args.amountMinor\]\)/);
assert.match(ledger,/balanceMinor:\{gte:args.amountMinor\}/);
assert.match(auth,/argon2.verify/);
assert.match(auth,/httpOnly:true/);
assert.match(session,/requireSession/);
assert.match(mpin,/mpinLockedUntil/);
assert.match(wallet,/availableMinor:wallet.balanceMinor.toString\(\)/);
assert.ok(existsSync(new URL('../apps/web/src/main.tsx',import.meta.url)));
console.log('PASS: static foundation checks (NOT runtime, schema validation or integration tests).');
// Regression guards for defects found in checkpoint 11: double-escaped six-digit
// regular expressions rejected every valid TOTP/MPIN, and auth had a duplicate import.
const totp=read('apps/api/src/totp.ts');
for(const [name,source] of [['auth.ts',auth],['mpin.ts',mpin],['totp.ts',totp]]){
 assert.ok(!source.includes(String.raw`\\d{6}`),`${name}: double-escaped six-digit regex`);
 assert.ok(source.includes(String.raw`\d{6}`),`${name}: expected six-digit regex`);
}
assert.equal((auth.match(/import \{ requireTrustedOrigin, sessionToken, tokenHash \} from '\.\/session\.js';/g)??[]).length,1,'auth.ts: shared session helpers import');
assert.ok(!auth.includes('function cookie('),'auth.ts: must reuse sessionToken instead of local cookie parser');
assert.ok(auth.includes('sessionToken(req)'),'auth.ts: /me and logout must use sessionToken');
assert.ok(auth.includes('expiresAt<=new Date()')||auth.includes('expiresAt <= new Date()'),'auth.ts: /me must use consistent expired-session check');
assert.match(mpin,/mpinFailures:u\.mpinFailures,mpinLockedUntil:u\.mpinLockedUntil/);
console.log('PASS: OTP/MPIN regex, shared session helpers and MPIN CAS source guards.');

assert.ok(existsSync(new URL('../apps/api/src/db.ts',import.meta.url)), 'shared db.ts missing');
const dbSrc = read('apps/api/src/db.ts');
assert.match(dbSrc, /export const db = new PrismaClient/);
for (const name of ['server.ts','auth.ts','mpin.ts','session.ts','wallet.ts']) {
  const src = read('apps/api/src/' + name);
  assert.ok(!src.includes('new PrismaClient'), name + ': must use shared db, not new PrismaClient');
  assert.ok(src.includes("from './db.js'") || name === 'server.ts' && src.includes("from './db.js'"), name + ': import shared db');
}
console.log('PASS: shared Prisma client centralization guard.');
