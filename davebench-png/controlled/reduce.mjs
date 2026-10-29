import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const median = a => {const s=[...a].sort((a,b)=>a-b), n=s.length;if(!n)throw Error('No samples');return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;};
function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
// Cases are the resampling unit. This describes this fixed profile, not the
// population of Mermaid programs. Repeated calls are not independent cases.
export function ratio(a,b,iterations=10000){
 if(a.length!==b.length||!a.length||a.some(x=>!(x>0))||b.some(x=>!(x>0)))throw Error('Invalid paired samples');
 const logs=a.map((x,i)=>Math.log(x/b[i])),mean=xs=>xs.reduce((s,x)=>s+x,0)/xs.length;
 const rng=random(20261029),boot=[];
 for(let n=0;n<iterations;n++){let sum=0;for(let i=0;i<logs.length;i++)sum+=logs[Math.floor(rng()*logs.length)];boot.push(Math.exp(sum/logs.length));}
 boot.sort((a,b)=>a-b);return {estimate:Math.exp(mean(logs)),ci95:[boot[Math.floor(iterations*.025)],boot[Math.floor(iterations*.975)]]};
}
export function reduce(directory){
 const read=f=>JSON.parse(fs.readFileSync(path.join(directory,f),'utf8'));
 const context=read('context.json'),complete=read('completed.json');
 if(!complete.complete||context.preflight)throw Error('Completed measured run required');
 const rows=fs.readFileSync(path.join(directory,'rows.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 if(rows.some(r=>r.status!=='ok'))throw Error('Run contains failed outputs');
 const measured=rows.filter(r=>r.phase==='measure'),cases=context.commonCases,byLibrary={};
 for(const p of context.participants){
  const perCase=cases.map(id=>{
   const samples=measured.filter(r=>r.participant===p.id&&r.case===id);
   for(const variant of ['A','B'])if(samples.filter(r=>r.variant===variant).length!==context.rounds*context.repetitions)throw Error('Incomplete replica/case');
   return {id,A:median(samples.filter(r=>r.variant==='A').map(r=>r.totalMs)),B:median(samples.filter(r=>r.variant==='B').map(r=>r.totalMs)),totalMs:median(samples.map(r=>r.totalMs)),apiMs:median(samples.map(r=>r.apiMs)),normalizationMs:median(samples.map(r=>r.normalizationMs)),samples:samples.length};
  });
  const aa=ratio(perCase.map(c=>c.A),perCase.map(c=>c.B));aa.pass=aa.ci95[0]>=.90&&aa.ci95[1]<=1.10;
  byLibrary[p.id]={version:p.version,cases:perCase.length,samples:perCase.reduce((s,c)=>s+c.samples,0),medianCaseMs:median(perCase.map(c=>c.totalMs)),aa,perCase};
 }
 const calibrated=Object.values(byLibrary).every(p=>p.aa.pass),comparisons=[];
 if(calibrated)for(let i=0;i<context.participants.length;i++)for(let j=i+1;j<context.participants.length;j++){
  const a=context.participants[i].id,b=context.participants[j].id;
  comparisons.push({numerator:a,denominator:b,...ratio(byLibrary[a].perCase.map(c=>c.totalMs),byLibrary[b].perCase.map(c=>c.totalMs))});
 }
 return {protocol:context.protocol,calibrated,aaPolicy:context.aaPolicy,scope:context.contract.scope,byLibrary,comparisons,measured:measured.length,warmups:rows.length-measured.length};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const result=reduce(path.resolve(process.argv[2]));fs.writeFileSync(path.resolve(process.argv[2],'summary.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({calibrated:result.calibrated,measured:result.measured,warmups:result.warmups,libraries:Object.fromEntries(Object.entries(result.byLibrary).map(([k,v])=>[k,{medianCaseMs:v.medianCaseMs,aa:v.aa}]))},null,2));
}
