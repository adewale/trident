import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {docsArtifactServer,docsInventory} from '../../unified/docs-benchmark.ts';
import {configureControlled,controlledExport} from '../controlled/browser.ts';
import {configureSeven} from './browser.ts';
import {inspect} from '../controlled/png.mjs';
import {isolationSnapshot} from '../controlled/isolation.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const opts={};for(let i=2;i<process.argv.length;i+=2){if(!process.argv[i].startsWith('--')||!process.argv[i+1])throw Error('Expected --key value');opts[process.argv[i].slice(2)]=process.argv[i+1];}
if(!opts.out||!opts.assets||!['qualification','coverage','measure'].includes(opts.phase))throw Error('Specify --out, --assets and --phase');
const out=path.resolve(opts.out),assets=path.resolve(opts.assets);fs.mkdirSync(out);fs.mkdirSync(out+'/png');fs.mkdirSync(out+'/svg');
const hash=b=>createHash('sha256').update(b).digest('hex');
const fileHash=f=>hash(fs.readFileSync(f));
const profile=JSON.parse(fs.readFileSync(import.meta.dirname+'/../controlled/cases.json'));
const inventory=docsInventory(opts.upstream??'/workspace/mermaid');
if(inventory.occurrences!==548)throw Error('Unexpected pinned DaveBench inventory');
fs.writeFileSync(out+'/inventory.json',JSON.stringify(inventory,null,2));
fs.writeFileSync(out+'/profile.json',JSON.stringify(profile,null,2));
const publicPackages=root+'/davebench-png/node_modules';
const build=JSON.parse(fs.readFileSync(assets+'/build.json'));
if(fileHash(import.meta.dirname+'/flutter_worker.dart')!==build.flutter.source||fileHash(import.meta.dirname+'/dart/worker.dart')!==build.dart.source)throw Error('Native build source mismatch');
const catalog=[
 {id:'mermaid',name:'Mermaid',version:'12.2.0',runtime:'Chromium',base:publicPackages+'/mermaid',entry:'dist/mermaid.min.js',api:'mermaid.render'},
 {id:'agentic',name:'Agentic Mermaid',version:'0.4.1',runtime:'Chromium',base:publicPackages+'/agentic-mermaid',entry:'dist/browser.global.js',api:'renderMermaidSVG'},
 {id:'beautiful',name:'Beautiful Mermaid',version:'1.1.3',runtime:'Chromium',base:assets,entry:'beautiful-mermaid.js',api:'renderMermaidSVG'},
 {id:'zombie',name:'Zombie Mermaid',version:'5.10.2',runtime:'Chromium',base:assets,entry:'zombie-mermaid.js',api:'renderMermaidSVG'},
 {id:'dart',name:'Mermaid Dart',version:'0.3.2',runtime:'native Dart AOT + Chromium PNG converter',base:assets,api:'Mermaid.render + renderSceneToSvg',exe:assets+'/mermaid-dart'},
 {id:'flutter',name:'Mermaid Flutter',version:'0.3.2',runtime:'native Flutter Linux release',api:'renderToPng',exe:build.flutter.bundle+'/native_bench'},
 {id:'pele',name:'Pele',version:'1.9.0',runtime:'Chromium',base:publicPackages+'/pele',entry:'dist/pele.global.js',api:'pele.render'},
];
const participants=opts.participants?opts.participants.split(',').map(id=>{const p=catalog.find(p=>p.id===id);if(!p)throw Error('Unknown participant '+id);return p;}):catalog;
if(new Set(participants.map(p=>p.id)).size!==participants.length)throw Error('Duplicate participant');
for(const p of participants.filter(p=>['mermaid','agentic','pele'].includes(p.id)))if(JSON.parse(fs.readFileSync(p.base+'/package.json')).version!==p.version)throw Error('Package version mismatch');
for(const p of build.bundles)if(fileHash(p.bundle)!==p.sha256)throw Error('Browser build receipt mismatch');
if(fileHash(assets+'/mermaid-dart')!==build.dart.executable)throw Error('Dart executable differs from build receipt');
for(const f of build.flutter.outputs)if(fileHash(build.flutter.bundle+'/'+f.file)!==f.sha256)throw Error('Flutter bundle differs from build receipt');
const font=out+'/Inter-Regular.ttf';fs.copyFileSync(publicPackages+'/agentic-mermaid/assets/fonts/Inter-Regular.ttf',font);
const escaped=out.replaceAll('&','&amp;').replaceAll('<','&lt;');
const fontconfig=`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${escaped}</dir><cachedir>${escaped}/font-cache</cachedir><match target="font"><edit name="hinting" mode="assign"><bool>false</bool></edit><edit name="autohint" mode="assign"><bool>false</bool></edit><edit name="hintstyle" mode="assign"><const>hintnone</const></edit><edit name="antialias" mode="assign"><bool>true</bool></edit><edit name="rgba" mode="assign"><const>none</const></edit></match><alias><family>sans-serif</family><prefer><family>Inter</family></prefer></alias></fontconfig>`;
fs.writeFileSync(out+'/fontconfig.conf',fontconfig);process.env.FONTCONFIG_FILE=out+'/fontconfig.conf';
const sources=['run.mjs','browser.ts','prepare.mjs','container.py','analyze.py','flutter_worker.dart','dart/worker.dart','dart/pubspec.yaml','dart/pubspec.lock','packages/package.json','packages/package-lock.json'].map(f=>({file:'davebench-png/seven/'+f,sha256:fileHash(import.meta.dirname+'/'+f)}));
for(const f of ['davebench-png/controlled/browser.ts','davebench-png/controlled/png.mjs','davebench-png/controlled/cases.json','davebench-png/controlled/isolation.mjs','unified/docs-benchmark.ts','native-flutter/env.sh'])sources.push({file:f,sha256:fileHash(root+'/'+f)});
const sealed=[...participants.filter(p=>p.entry).map(p=>p.base+'/'+p.entry),assets+'/build.json',assets+'/mermaid-dart',...build.flutter.outputs.map(f=>build.flutter.bundle+'/'+f.file),'/usr/lib/chromium/chromium',publicPackages+'/../package-lock.json',font].map(file=>({file,sha256:fileHash(file)}));
const identity=hash(JSON.stringify({sources,sealed:sealed.filter(f=>f.file!==font),font:fileHash(font),participants,contract:profile.contract}));
const review=opts.review?JSON.parse(fs.readFileSync(opts.review)):undefined;
if(opts.phase==='measure'&&(!review||review.renderIdentity!==identity||JSON.stringify(review.participants)!==JSON.stringify(participants.map(p=>p.id))))throw Error('Reviewed qualification identity/participants mismatch');
const chosen=opts.phase==='coverage'?inventory.cases:opts.phase==='qualification'?profile.cases:profile.cases.filter(c=>review.cases[c.id]?.eligible);
if(!chosen.length)throw Error('No eligible inputs');
const blocks=opts.phase==='measure'?Number(opts.blocks??20):1,repetitions=opts.phase==='measure'?Number(opts.repetitions??3):1;
if(!Number.isInteger(blocks)||blocks<1||!Number.isInteger(repetitions)||repetitions<1)throw Error('Invalid repetition count');
let rngState=20261029;function rng(){rngState|=0;rngState=rngState+0x6D2B79F5|0;let t=Math.imul(rngState^rngState>>>15,1|rngState);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
function shuffle(xs){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const baseOrder=shuffle(participants),schedule=[];
for(let block=1;block<=blocks;block++){let order=[...baseOrder.slice((block-1)%participants.length),...baseOrder.slice(0,(block-1)%participants.length)];if(Math.floor((block-1)/participants.length)%2)order.reverse();schedule.push({block,participants:order.map(p=>p.id)});}
const context={protocol:'davebench-seven-isolated-client-png-v1',startedAt:new Date().toISOString(),phase:opts.phase,baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sources,sealed,renderIdentity:identity,participants,build,font:{sha256:fileHash(font),selection:execFileSync('fc-match',['-f','%{family}: %{file}','Inter'],{encoding:'utf8'})},contract:profile.contract,metric:'Client wall time from dispatch of one source through binary PNG bytes consumed in Node; all artifact writes and output inspection outside clock. Public API and conversion clocks also retained. Dart native SVG requires an explicit Chromium conversion bridge; no Flutter substitution.',corpus:inventory.pin,inputs:chosen.map(c=>c.id),blocks,repetitions,warmupPasses:2,seed:20261029,schedule,isolation:isolationSnapshot(),runtime:JSON.parse(fs.readFileSync(opts['runtime-receipt'])),versions:{node:process.version,chromium:execFileSync('/usr/bin/chromium',['--version'],{encoding:'utf8'}).trim()},machine:{os:execFileSync('uname',['-a'],{encoding:'utf8'}).trim(),cpu:execFileSync('lscpu',{encoding:'utf8'}),osRelease:fs.readFileSync('/etc/os-release','utf8')}};
fs.writeFileSync(out+'/context.json',JSON.stringify(context,null,2));
if(review)fs.copyFileSync(opts.review,out+'/review.json');
fs.mkdirSync(out+'/source');for(const f of sources){const name=f.file.replaceAll('/','__');fs.copyFileSync(root+'/'+f.file,out+'/source/'+name);}
const inspectionCache=new Map();let serial=0;const rows=[];
function snapshot(phase,participant,block){fs.appendFileSync(out+'/isolation.jsonl',JSON.stringify({phase,participant,block,cpuStat:fs.readFileSync('/sys/fs/cgroup/cpu.stat','utf8'),...isolationSnapshot()})+'\n');}
async function deadline(promise,ms,label){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' deadline')),ms);})]);}finally{clearTimeout(timer);}}
async function worker(exe,label){
 const child=spawn(exe,[],{cwd:path.dirname(exe),env:{...process.env,CONTROLLED_FONT:font},detached:true,stdio:['pipe','pipe','pipe']});let pending,resolveReady,rejectReady;const ready=new Promise((a,b)=>{resolveReady=a;rejectReady=b;});let log='';
 child.stderr.on('data',b=>{log=(log+String(b)).slice(-200000);});
 createInterface({input:child.stdout}).on('line',line=>{if(line.startsWith('@@READY@@'))resolveReady(JSON.parse(line.slice(9)));else if(line.startsWith('@@RESULT@@')){const p=pending;pending=undefined;p?.resolve(JSON.parse(line.slice(10)));}else log+=line+'\n';});
 child.on('error',e=>{rejectReady(e);pending?.reject(e);});child.on('close',code=>{rejectReady(Error(label+' exited '+code));pending?.reject(Error(label+' exited '+code));});
 let metadata;try{metadata=await deadline(ready,30000,label+' ready');}catch(e){try{process.kill(-child.pid,'SIGKILL');}catch{}throw e;}
 if(label==='flutter'&&!metadata.release)throw Error('Flutter must be release');if(label==='dart'&&!metadata.aot)throw Error('Dart must be native AOT');
 return {metadata,pid:child.pid,render(source,id){return new Promise((resolve,reject)=>{pending={resolve,reject};child.stdin.write(JSON.stringify({source,id})+'\n');});},async close(){if(child.exitCode===null&&child.signalCode===null){const ended=new Promise(r=>child.once('close',r));child.stdin.end();const timer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},3000);await ended;clearTimeout(timer);}return log;}};
}
async function actor(p){
 let browser,server,context,page,native;const metadata={};
 const close=async()=>{if(native){const log=await native.close();fs.appendFileSync(out+'/'+p.id+'.log',log);}await browser?.close();if(server)await new Promise(r=>server.close(r));};
 try{
  if(p.id!=='flutter'){
   server=docsArtifactServer(p.base,p.id==='mermaid'?{root:publicPackages+'/@mermaid-js/mermaid-zenuml'}:undefined);await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
   browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});context=await browser.newContext();await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());page=await context.newPage();page.setDefaultTimeout(20000);await page.goto(origin+'/blank');
   if(p.entry)await page.addScriptTag({url:origin+'/'+p.entry});
   Object.assign(metadata,await page.evaluate(['mermaid','agentic','pele'].includes(p.id)?configureControlled:configureSeven,{kind:p.id}));
   if(p.id==='mermaid')await page.evaluate(async url=>{const addon=await import(url);await globalThis.mermaid.registerExternalDiagrams([addon.default]);},origin+'/__addon/dist/mermaid-zenuml.core.mjs');
  }
  if(p.exe){native=await worker(p.exe,p.id);metadata.native=native.metadata;}
  return {metadata,close,async render(c,id){
   if(p.id==='flutter')return native.render(c.source,id);
   if(p.id==='dart'){
    const value=await native.render(c.source,id);if(value.status!=='ok')return value;
    const converted=await page.evaluate(controlledExport,{source:value.svg,id});
    return {...converted,normalizationMs:converted.totalMs,apiMs:value.apiMs,totalMs:value.apiMs+(converted.totalMs??0),svg:value.svg};
   }
   return page.evaluate(controlledExport,{source:c.source,id});
  }};
 }catch(e){await close();throw e;}
}
async function call(a,p,c,phase,block,rep){
 const id='s'+String(serial++).padStart(6,'0');let result,bytes,clientMs;
 try{
  const start=performance.now();result=await deadline(a.render(c,id),20000,p.id+' '+c.id);
  if(result.pngBase64){bytes=Buffer.from(result.pngBase64,'base64');const consumed=bytes.length;if(!consumed)throw Error('No binary PNG bytes');}
  clientMs=performance.now()-start;
  delete result.pngBase64;
  if(result.svg){fs.writeFileSync(out+'/svg/'+id+'.svg',result.svg);delete result.svg;}
  if(result.intrinsicPngBase64){fs.writeFileSync(out+'/png/'+id+'.intrinsic.png',Buffer.from(result.intrinsicPngBase64,'base64'));delete result.intrinsicPngBase64;}
  if(bytes){
   fs.writeFileSync(out+'/png/'+id+'.png',bytes);result.png='png/'+id+'.png';
   const encodedSha256=hash(bytes);let inspection=inspectionCache.get(encodedSha256);
   if(!inspection){inspection={...inspect(bytes,true),encodedSha256};inspectionCache.set(encodedSha256,inspection);}
   result.inspection=inspection;
   if(phase==='measure'||phase==='warmup'){
    const expected=review?.cases[c.id]?.pixels[p.id];
    if(expected&&expected!==inspection.pixelSha256){result.status='stability-failed';result.detail='Painted pixels differ from pre-reviewed qualification';}
   }
  }
  if(result.status==='ok'&&!bytes)throw Error('Successful render returned no PNG');
 }catch(e){result={...result,status:String(e).includes('deadline')?'timeout':'contract-failed',detail:String(e)};}
 const row={id,case:c.id,participant:p.id,phase,block,rep,...result,renderWorkMs:result?.totalMs,totalMs:clientMs};
 if(opts.phase!=='measure')for(const key of Object.keys(row))if(key.endsWith('Ms'))delete row[key];
 rows.push(row);fs.appendFileSync(out+'/rows.jsonl',JSON.stringify(row)+'\n');return row;
}
async function assertNoActor(){
 for(let attempt=0;attempt<50;attempt++){
  const alive=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x)).flatMap(pid=>{try{const cmd=fs.readFileSync('/proc/'+pid+'/cmdline','utf8');return /--type=renderer|\/native_bench\u0000|\/mermaid-dart\u0000/.test(cmd)?[{pid,cmd}]:[];}catch{return[];}});
  if(!alive.length)return;await new Promise(r=>setTimeout(r,100));
 }
 throw Error('Previous benchmark actor remains alive');
}
try{
 for(const slot of schedule)for(const id of slot.participants){
  const p=participants.find(p=>p.id===id);await assertNoActor();let a=await actor(p);
  fs.appendFileSync(out+'/actors.jsonl',JSON.stringify({participant:id,block:slot.block,...a.metadata})+'\n');snapshot('ready',id,slot.block);
  try{
   const warm=opts.phase==='measure'?chosen:[profile.cases[0]];
   for(let pass=0;pass<2;pass++)for(const c of warm){const r=await call(a,p,c,'warmup',slot.block,pass);if(r.status==='timeout'){await a.close();a=await actor(p);}}
   snapshot('warmup-complete',id,slot.block);console.log(opts.phase,'block',slot.block,'/',blocks,id,chosen.length,'inputs',new Date().toISOString());
   for(let rep=0;rep<repetitions;rep++)for(const c of opts.phase==='measure'?shuffle(chosen):chosen){const r=await call(a,p,c,opts.phase==='measure'?'measure':opts.phase,slot.block,rep);if(r.status==='timeout'){await a.close();a=await actor(p);}}
   snapshot('complete',id,slot.block);
  }finally{await a.close();}
  await assertNoActor();
 }
 for(const f of sealed)if(fileHash(f.file)!==f.sha256)throw Error('Sealed artifact changed');for(const f of sources)if(fileHash(root+'/'+f.file)!==f.sha256)throw Error('Producer changed');
 fs.writeFileSync(out+'/completed.json',JSON.stringify({complete:true,finishedAt:new Date().toISOString(),rows:rows.length}));
}catch(e){fs.writeFileSync(out+'/failure.json',JSON.stringify({error:String(e),at:new Date().toISOString(),rows:rows.length},null,2));throw e;}
