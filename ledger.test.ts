import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { assertBalanced, parsePositiveMinorUnits } from './ledger.js';
test('amounts require positive exact integer strings',()=>{
 assert.equal(parsePositiveMinorUnits('100'),100n);
 for(const bad of ['0','-1','1.5','01','1e3',1,NaN,'1000000000000000']) assert.throws(()=>parsePositiveMinorUnits(bad));
});
test('journal requires at least two nonzero entries summing to zero',()=>{
 assert.doesNotThrow(()=>assertBalanced([-100n,100n]));
 assert.throws(()=>assertBalanced([-100n,99n]));
 assert.throws(()=>assertBalanced([0n,0n]));
});
