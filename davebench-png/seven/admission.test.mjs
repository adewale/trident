import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReview, requireWarmupSuccess} from './admission.mjs';

test('timing requires a complete successful review and pixel matrix', () => {
  const cases=[{id:'input',role:'candidate'}],review={renderIdentity:'identity',participants:['a','b'],cases:{input:{eligible:true,checks:{a:{pass:true},b:{pass:true}},pixels:{a:'a'.repeat(64),b:'b'.repeat(64)}}}};
  assert.doesNotThrow(()=>validateReview(review,'identity',['a','b'],cases));
  const missing=structuredClone(review);delete missing.cases.input.pixels.b;
  assert.throws(()=>validateReview(missing,'identity',['a','b'],cases),/Missing/);
  const failed=structuredClone(review);failed.cases.input.checks.b.pass=false;
  assert.throws(()=>validateReview(failed,'identity',['a','b'],cases),/Missing/);
  assert.throws(()=>validateReview(review,'identity',['a','b'],[{id:'input',role:'negative-control'}]),/Invalid/);
});

test('failed warmups cannot continue into measured process history', () => {
  assert.doesNotThrow(()=>requireWarmupSuccess({status:'ok'}));
  for(const status of ['timeout','error','stability-failed','contract-failed']) {
    assert.throws(()=>requireWarmupSuccess({participant:'a',case:'input',status}),/process history invalid/);
  }
});
