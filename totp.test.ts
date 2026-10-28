import { test } from 'node:test';import { strict as assert } from 'node:assert';import { newTotpSecret,totp,verifyTotp } from './totp.js';
test('TOTP round trip and invalid codes',()=>{const s=newTotpSecret(),code=totp(s,600000);assert.equal(s.length,32);assert.equal(verifyTotp(s,code,600000),true);assert.equal(verifyTotp(s,'00000x',600000),false);});
