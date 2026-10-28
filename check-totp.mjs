// Run with Node 22+: node --experimental-strip-types scripts/check-totp.mjs
import { strict as assert } from 'node:assert';
import { newTotpSecret, totp, verifyTotp } from '../apps/api/src/totp.ts';
const secret=newTotpSecret();
for(const at of [600000, 1700000000000, 1800000000000]){
 const code=totp(secret,at);
 assert.match(code,/^\d{6}$/);
 assert.equal(verifyTotp(secret,code,at),true,'generated code must verify');
 assert.equal(verifyTotp(secret,'00000x',at),false);
}
console.log('PASS: dependency-free TOTP runtime round-trip (not authentication integration).');
