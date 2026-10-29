import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {inspect} from './png.mjs';
import {ratio} from './reduce.mjs';
function image(width=1200,height=900){const p=new PNG({width,height});p.data.fill(255);return p;}
test('fixed PNG gate rejects blank, wrong size, alpha and clipped content',()=>{
 const p=image();assert.throws(()=>inspect(PNG.sync.write(p)),/visible/);
 assert.throws(()=>inspect(PNG.sync.write(image(1199))),/1200x900/);
 p.data[(50*1200+50)*4]=0;const a=inspect(PNG.sync.write(p));assert.equal(a.width,1200);
 p.data[3]=0;assert.throws(()=>inspect(PNG.sync.write(p)),/opaque/);p.data[3]=255;
 p.data[0]=0;assert.throws(()=>inspect(PNG.sync.write(p)),/margin/);
});
test('decoded pixel identity ignores compression but detects changed pixels',()=>{
 const p=image();p.data[(50*1200+50)*4]=0;
 const a=inspect(PNG.sync.write(p,{deflateLevel:1})),b=inspect(PNG.sync.write(p,{deflateLevel:9}));assert.equal(a.pixelSha256,b.pixelSha256);
 p.data[(50*1200+51)*4]=0;assert.notEqual(a.pixelSha256,inspect(PNG.sync.write(p)).pixelSha256);
});
test('paired A/A calibration rejects systematic bias and retains equal replicas',()=>{
 assert.deepEqual(ratio([1,2,3],[1,2,3]).ci95,[1,1]);
 const biased=ratio([2,4,6],[1,2,3]);assert.equal(biased.estimate,2);assert.ok(biased.ci95[0]>1.1);
});
