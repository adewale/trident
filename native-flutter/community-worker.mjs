#!/usr/bin/env node
// Adapter transport only: the native Flutter child owns every renderToPng call.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {qualifyOutput} from '../unified/qualification.ts';
import {inspectPng} from '../unified/png-inspection.ts';
import {admitNativeLaunch} from './community-launch.mjs';
const [launchPath,jobPath,resultPath,...extra]=process.argv.slice(2);
if(!launchPath||!jobPath||!resultPath||extra.length)throw Error('Expected LAUNCH_MANIFEST JOB RESULT arguments');
const launch=admitNativeLaunch(launchPath);
const job=JSON.parse(fs.readFileSync(jobPath,'utf8'));
if(job.output!=='png')throw Error('Native Flutter binding exposes the advertised PNG API only');
const dir=resultPath+'.native';fs.mkdirSync(dir);
const raw=path.join(dir,'raw.jsonl');
const fd=fs.openSync(resultPath,'wx');let emitted=0;
const executable=launch.executable;
const sha256=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync(path.join(dir,'launch.json'),JSON.stringify({launchManifest:path.resolve(launchPath),version:launch.version,entrypoint:launch.entrypoint,executable:path.resolve(executable),sha256:sha256(executable),libappSha256:sha256(path.join(path.dirname(executable),'lib/libapp.so'))},null,2));
const qualify=(w,bytes)=>{if(!job.requireNonblankPng)return qualifyOutput({id:w.id,source:w.source,expectedLabels:w.expected},bytes,'png');const q=inspectPng(bytes,true);return {...q,ok:!q.findings.length};};
const child=spawn(executable,[],{env:{...process.env,FLUTTER_COMMUNITY_JOB:path.resolve(jobPath),FLUTTER_COMMUNITY_RAW:raw,FLUTTER_COMMUNITY_DIR:path.resolve(dir)},stdio:['ignore','inherit','inherit']});
function collect(){
 if(!fs.existsSync(raw))return;
 const runtime=JSON.parse(fs.readFileSync(path.join(dir,'runtime.json'),'utf8'));
 if(runtime.release!==true||runtime.entrypoint!==launch.entrypoint||runtime.packageVersion!==launch.version)throw Error('Native runtime does not match the admitted release/API');
 const lines=fs.readFileSync(raw,'utf8').split('\n');lines.pop();
 for(;emitted<lines.length;emitted++){
  const r=JSON.parse(lines[emitted]);const w=job.workloads.find(w=>w.id===r.workload);
  if(!w||r.release!==true||r.sequence!==emitted)throw Error('Unowned workload or non-release output');
  if(r.status==='ok'){
   const png=fs.readFileSync(r.png);const q=qualify(w,png);
   const first=qualify(w,fs.readFileSync(r.firstPng));
   r.pngReturned=true;
   r.firstQualification=first;
   const failed=[first,q].some(value=>!value.ok&&!value.unavailable);
   r.status=failed?'error':q.ok&&first.ok?'ok':'blocked';r.qualificationScope=q.scope;r.qualification=q;
   if(!q.ok||!first.ok){r.rejected=false;r.detail=[...first.findings,...q.findings].join('; ');}
  }
  fs.writeSync(fd,JSON.stringify(r)+'\n');fs.fsyncSync(fd);
  fs.writeFileSync(path.join(dir,`ack-${r.sequence}`),'qualified\n',{flag:'wx'});
 }
}
let collectionError;
const monitor=setInterval(()=>{try{collect();}catch(error){collectionError=error;child.kill('SIGKILL');}},100);
try {
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});
 if(collectionError)throw collectionError;
 collect();process.exitCode=code??1;
} finally {clearInterval(monitor);fs.closeSync(fd);if(child.exitCode===null)child.kill('SIGKILL');}
