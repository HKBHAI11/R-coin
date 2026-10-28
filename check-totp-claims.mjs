import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../apps/api/src/auth.ts',import.meta.url),'utf8');
assert.match(source,/updateMany\(\{where:\{id:user\.id,totpSecret:null,totpPendingSecret:null\}/,'setup must claim empty pending state');
assert.match(source,/updateMany\(\{where:\{id:u\.id,status:'ACTIVE',emailVerifiedAt:\{not:null\},totpSecret:null,totpPendingSecret:u\.totpPendingSecret\}/,'confirmation must claim exact observed pending state');
assert.equal((source.match(/if\(claimed\.count!==1\)/g)||[]).length,2,'both conditional writes must check claim result');
console.log('PASS: TOTP setup/confirmation conditional-write source guards (not concurrency integration).');
