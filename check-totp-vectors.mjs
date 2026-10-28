import assert from 'node:assert/strict';
import { totp, verifyTotp, base32 } from '../apps/api/src/totp.ts';
// RFC 6238 Appendix B SHA-1 seed; expected values are its final six digits.
const seed=base32(Buffer.from('12345678901234567890','ascii'));
for(const [seconds,expected] of [[59,'287082'],[1111111109,'081804'],[1111111111,'050471'],[1234567890,'005924'],[2000000000,'279037'],[20000000000,'353130']]) {
 assert.equal(totp(seed,seconds*1000),expected,`RFC vector at ${seconds}`);
 assert.equal(verifyTotp(seed,expected,seconds*1000),true);
}
const at=120000;
assert.equal(verifyTotp(seed,totp(seed,at-30000),at),true,'previous window');
assert.equal(verifyTotp(seed,totp(seed,at+30000),at),true,'next window');
assert.equal(verifyTotp(seed,totp(seed,at-60000),at),false,'outside previous window');
for(const malformed of ['12345','1234567','12345a','１２３４５６','']) assert.equal(verifyTotp(seed,malformed,at),false);
console.log('PASS: six RFC 6238 SHA-1 vectors, window boundaries, invalid input (algorithm only).');
