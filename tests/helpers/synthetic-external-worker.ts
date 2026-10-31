/** Synthetic API transport controls, outside the ecosystem benchmark corpus.
 * Each API call owns a durable start and exact return/error before grading. */
export function syntheticExternalWorkerSource(options: { observerBlockedCase?: string; rejectedCase?: string; exitAfterRejection?: number } & ({ output: 'png' } | { output: 'terminal'; terminalText: string })) {
  const journal = new URL('../../portable/invocation-journal.ts', import.meta.url).href
  const inspector = new URL('../../unified/png-inspection.ts', import.meta.url).href
  return `#!/usr/bin/env node
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {crc32,deflateSync} from 'node:zlib';
import {InvocationJournal} from ${JSON.stringify(journal)};
import {inspectPng} from ${JSON.stringify(inspector)};
const options=${JSON.stringify(options)},[job,out]=process.argv.slice(2),tasks=JSON.parse(fs.readFileSync(job,'utf8'));
const journal=new InvocationJournal(out+'.worker-journal'),raw=out+'.invocations.jsonl';
fs.writeFileSync(out,'');
function publish(frame){const fd=fs.openSync(raw,'a');try{fs.writeSync(fd,JSON.stringify(frame)+'\\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}}
function chunk(type,data){const bytes=Buffer.alloc(data.length+12);bytes.writeUInt32BE(data.length);bytes.write(type,4);bytes.set(data,8);bytes.writeUInt32BE(crc32(bytes.subarray(4,-4)),bytes.length-4);return bytes}
class SourceRejection extends Error{}
function syntheticApi(source,id){
  fs.appendFileSync(out+'.api-calls.jsonl',JSON.stringify({id,source})+'\\n');
  if(id===options.rejectedCase)throw new SourceRejection('Explicit API rejection');
  if(options.output==='terminal')return options.terminalText;
  const header=Buffer.alloc(13);header.writeUInt32BE(2);header.writeUInt32BE(1,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from([0,17,34,51,255,200,150,100,255]))),chunk('IEND',Buffer.alloc(0))]);
}
for(const workload of tasks.workloads){
  const started=journal.start(workload.invocationIdentity);publish(started);
  let value,receipt,error;const begin=performance.now();
  try{value=syntheticApi(workload.source,workload.id)}catch(caught){error=caught}
  const elapsed=performance.now()-begin;
  receipt=error?journal.failed(started,error,elapsed):journal.returned(started,value,elapsed);publish(receipt);
  // No observer can erase or replace the retained public-call result.
  const inspection=!error&&options.output==='png'?inspectPng(value,true):undefined;
  const blocked=workload.id===options.observerBlockedCase;
  const grade={workload:workload.id,invocationId:receipt.attemptId,status:error?'error':blocked?'blocked':inspection?.findings.length?'error':'ok',qualificationScope:inspection?.scope,detail:error?error.message:blocked?'PNG observer budget exceeded':inspection?.findings.join('; ')||undefined,rejected:error instanceof SourceRejection,outputFile:receipt.output?.path};
  fs.appendFileSync(out,JSON.stringify(grade)+'\\n');
  if(error&&options.exitAfterRejection)process.exit(options.exitAfterRejection);
}
`
}
