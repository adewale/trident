// This child executes the published Node PNG API, not the Chromium SVG binding.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {inspectPng} from './png-inspection.ts';
const [jobFile,resultFile] = process.argv.slice(2);
const job = JSON.parse(fs.readFileSync(jobFile,'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(job.artifactRoot,'package.json'),'utf8'));
if(pkg.name!=='agentic-mermaid'||pkg.version!=='0.4.1')throw Error('Expected published agentic-mermaid 0.4.1');
const api=await import(pathToFileURL(path.join(job.artifactRoot,'dist/agent.js')).href);
fs.mkdirSync(resultFile+'.pngs');
const fd=fs.openSync(resultFile,'wx');
for(const [index,w] of job.workloads.entries()){
 const row={workload:w.id, runtime:'Node '+process.versions.node, api:'renderMermaidPNG', pngReturned:false};
 let stage='public-api';
 try{
  const clock=performance.now();
  const bytes=api.renderMermaidPNG(w.source,{scale:1});
  const outputBytes=bytes.byteLength;
  row.firstMs=performance.now()-clock;row.pngReturned=true;row.outputBytes=outputBytes;
  stage='qualification';
  const png=path.resolve(resultFile+'.pngs',index+'.png');fs.writeFileSync(png,bytes);row.png=png;
  const q=inspectPng(bytes,true);row.qualification=q;row.width=q.width??(bytes.length>=24?Buffer.from(bytes).readUInt32BE(16):null);row.height=q.height??(bytes.length>=24?Buffer.from(bytes).readUInt32BE(20):null);
  row.status=q.unavailable?'blocked':q.findings.length?'error':'ok';
  if(q.findings.length){row.detail=q.findings.join('; ');row.failureStage='qualification';}
 }catch(error){row.status=stage==='public-api'?'error':'blocked';row.failureStage=stage;row.detail=String(error);row.errorName=error?.name;}
 fs.writeSync(fd,JSON.stringify(row)+'\n');fs.fsyncSync(fd);
}
fs.closeSync(fd);
