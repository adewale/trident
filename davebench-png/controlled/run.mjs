import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {docsArtifactServer} from '../../unified/docs-benchmark.ts';
import {protocolIdentity} from '../../unified/protocol-identity.ts';
import {configureControlled,controlledExport} from './browser.ts';
import {inspect} from './png.mjs';
const root=path.resolve(import.meta.dirname,'../..');
const argv=process.argv.slice(2),opts={};
for(let i=0;i<argv.length;i++){if(argv[i]==='--preflight'){opts.preflight=true;continue;}if(!['--out','--review','--native-bundle','--font','--rounds','--repetitions'].includes(argv[i])||!argv[i+1])throw Error('Invalid argument');opts[argv[i].slice(2)]=argv[++i];}
if(!opts.out)throw Error('Specify fresh --out');
const out=path.resolve(opts.out);fs.mkdirSync(out);fs.mkdirSync(path.join(out,'png'));fs.mkdirSync(path.join(out,'svg'));
const manifestPath=path.join(import.meta.dirname,'cases.json'),manifest=JSON.parse(fs.readFileSync(manifestPath));
const sha=b=>createHash('sha256').update(b).digest('hex');
const suppliedFont=path.resolve(opts.font??path.join(root,'davebench-png/node_modules/agentic-mermaid/assets/fonts/Inter-Regular.ttf'));
fs.mkdirSync(path.join(out,'font'));const font=path.join(out,'font/Inter-Regular.ttf');fs.copyFileSync(suppliedFont,font);
const fontconfig=path.join(out,'fontconfig.conf');
const xmlPath=path.dirname(font).replaceAll('&','&amp;').replaceAll('<','&lt;');
fs.writeFileSync(fontconfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${xmlPath}</dir><cachedir>${out}/font-cache</cachedir><match target="font"><edit name="hinting" mode="assign"><bool>false</bool></edit><edit name="autohint" mode="assign"><bool>false</bool></edit><edit name="hintstyle" mode="assign"><const>hintnone</const></edit><edit name="antialias" mode="assign"><bool>true</bool></edit><edit name="rgba" mode="assign"><const>none</const></edit></match><alias><family>sans-serif</family><prefer><family>Inter</family></prefer></alias></fontconfig>`);
process.env.FONTCONFIG_FILE=fontconfig;
const bundle=path.resolve(opts['native-bundle']??path.join(root,'native-flutter/app/build/linux/x64/release/bundle'));
const receiptPath=path.resolve(bundle,'../../../..','controlled-build.json');
const receipt=JSON.parse(fs.readFileSync(receiptPath));
if(receipt.mode!=='release'||receipt.target!=='lib/fixed_png_worker.dart')throw Error('Wrong native build target/mode');
for(const f of receipt.inputs)if(sha(fs.readFileSync(path.join(root,'native-flutter/app',f.file)))!==f.sha256)throw Error('Stale native build input: '+f.file);
for(const f of receipt.outputs)if(sha(fs.readFileSync(path.join(bundle,f.file)))!==f.sha256)throw Error('Native build output mismatch: '+f.file);
const packages=path.join(root,'davebench-png/node_modules');
const roots=['davebench-png/controlled/run.mjs','davebench-png/controlled/build-native.mjs','davebench-png/controlled/browser.ts','davebench-png/controlled/png.mjs','davebench-png/controlled/reduce.mjs','davebench-png/controlled/cases.json','native-flutter/app/lib/fixed_png_worker.dart'];
const producers=opts.preflight?['PREFLIGHT: output qualification, never comparative timing']:protocolIdentity(root,roots);
const participants=[{id:'mermaid',pkg:'mermaid',version:'12.2.0',entry:'dist/mermaid.min.js'}, {id:'pele',pkg:'pele',version:'1.9.0',entry:'dist/pele.global.js'}, {id:'agentic',pkg:'agentic-mermaid',version:'0.4.1',entry:'dist/browser.global.js'}, {id:'flutter',pkg:'mermaid_flutter',version:'0.3.2'}];
for(const p of participants.filter(p=>p.entry)){const meta=JSON.parse(fs.readFileSync(path.join(packages,p.pkg,'package.json')));if(meta.version!==p.version)throw Error('Package pin mismatch');}
const bundleFiles=fs.readdirSync(bundle,{recursive:true}).map(f=>path.join(bundle,f)).filter(f=>fs.statSync(f).isFile());
const browserExe=process.env.CHROMIUM_EXECUTABLE??'/usr/bin/chromium';
const browserFiles=participants.filter(p=>p.entry).flatMap(p=>{const base=path.join(packages,p.pkg);return [path.join(base,'package.json'),...fs.readdirSync(path.join(base,'dist'),{recursive:true}).map(f=>path.join(base,'dist',f)).filter(f=>fs.statSync(f).isFile())];});
const files=[font,fontconfig,receiptPath,browserExe,...(fs.existsSync('/usr/lib/chromium/chromium')?['/usr/lib/chromium/chromium']:[]),...bundleFiles,path.join(root,'davebench-png/package-lock.json'),path.join(root,'native-flutter/app/pubspec.lock'),...browserFiles];
const sealed=files.map(file=>({file,sha256:sha(fs.readFileSync(file))}));
const context={protocol:'controlled-docs-png-v2',startedAt:new Date().toISOString(),contract:manifest.contract,manifestSha256:sha(fs.readFileSync(manifestPath)),font:{file:font,sha256:sha(fs.readFileSync(font)),fontconfig:process.env.FONTCONFIG_FILE,selection:execFileSync('fc-match',['-f','%{family}: %{file}\n','Inter'],{encoding:'utf8'})},versions:{node:process.version,chromium:execFileSync(process.env.CHROMIUM_EXECUTABLE??'/usr/bin/chromium',['--version'],{encoding:'utf8'})},machine:{host:execFileSync('hostname',{encoding:'utf8'}).trim(),os:execFileSync('uname',['-a'],{encoding:'utf8'}).trim(),cpu:execFileSync('lscpu',{encoding:'utf8'}),quota:fs.readFileSync('/sys/fs/cgroup/cpu.max','utf8'),memory:fs.readFileSync('/sys/fs/cgroup/memory.max','utf8')},participants,producers,sealed,preflight:!!opts.preflight};
fs.writeFileSync(path.join(out,'context.json'),JSON.stringify(context,null,2));fs.copyFileSync(manifestPath,path.join(out,'cases.json'));
context.sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
context.nativeEnvironment={display:process.env.DISPLAY,softwareGL:process.env.LIBGL_ALWAYS_SOFTWARE,flutterRoot:process.env.FLUTTER_ROOT,softwareRasterThreads:process.env.LP_NUM_THREADS,cpuAffinity:fs.readFileSync('/proc/self/status','utf8').split('Cpus_allowed_list:')[1].split('\n')[0].trim()};
const sdkVersion=path.join(process.env.FLUTTER_ROOT??'/missing','bin/cache/flutter.version.json');
if(fs.existsSync(sdkVersion))context.flutterSdk=JSON.parse(fs.readFileSync(sdkVersion));
context.osRelease=fs.readFileSync('/etc/os-release','utf8');
context.buildReceipt=receipt;fs.copyFileSync(receiptPath,path.join(out,'native-build.json'));
context.renderIdentity=sha(JSON.stringify({sources:roots.map(file=>({file,sha256:sha(fs.readFileSync(path.join(root,file)))})),artifacts:sealed.filter(f=>f.file!==fontconfig).map(f=>({file:f.file===font?'font/Inter-Regular.ttf':f.file,sha256:f.sha256})),fontconfig:sha(fs.readFileSync(fontconfig,'utf8').replaceAll(out,'<OUTPUT>')),versions:context.versions,nativeEnvironment:{softwareGL:context.nativeEnvironment.softwareGL,softwareRasterThreads:context.nativeEnvironment.softwareRasterThreads,cpuAffinity:context.nativeEnvironment.cpuAffinity}}));
fs.writeFileSync(path.join(out,'context.json'),JSON.stringify(context,null,2));
let review;
if(!opts.preflight){if(!opts.review)throw Error('A completed source-fact review is required BEFORE timing');review=JSON.parse(fs.readFileSync(opts.review));if(review.manifestSha256!==context.manifestSha256||review.fontSha256!==context.font.sha256||review.renderIdentity!==context.renderIdentity)throw Error('Review does not own manifest/font/producer/artifacts/runtime');fs.copyFileSync(opts.review,path.join(out,'review.json'));}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE??'/usr/bin/chromium'});
const actors=[],servers=[];let serial=0;
function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const rng=random(20261029),shuffle=a=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;};
async function nativeActor(variant){
 const child=spawn(path.join(bundle,'native_bench'),[],{env:{...process.env,CONTROLLED_FONT:font},stdio:['pipe','pipe','pipe'],detached:true});
 let pending,readyResolve,readyReject;const ready=new Promise((a,b)=>{readyResolve=a;readyReject=b;});let log='';
 child.stderr.on('data',d=>log+=String(d));
 const reader=createInterface({input:child.stdout});reader.on('line',line=>{if(line.startsWith('@@READY@@'))readyResolve(JSON.parse(line.slice(9)));else if(line.startsWith('@@RESULT@@')){const p=pending;pending=undefined;p?.resolve(JSON.parse(line.slice(10)));}else log+=line+'\n';});
 child.on('error',error=>{readyReject(error);pending?.reject(error);});child.on('close',code=>{if(code!==0){readyReject(Error('Native exit '+code));pending?.reject(Error('Native exit '+code));}});
 const timer=setTimeout(()=>readyReject(Error('Native ready timeout')),30000);let metadata;try{metadata=await ready;}finally{clearTimeout(timer);}
 if(!metadata.release)throw Error('Native worker is not release');
 return {id:'flutter',variant,metadata,async render(c,id,file){return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}reject(Error('Native case deadline'));},30000);pending={resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}};child.stdin.write(JSON.stringify({id,source:c.source,out:file})+'\n');});},async close(){child.stdin.end();const done=new Promise(resolve=>child.once('close',resolve));const t=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},5000);await done;clearTimeout(t);fs.writeFileSync(path.join(out,'native-'+variant+'.log'),log);}};
}
async function webActors(p,variants){
 const server=docsArtifactServer(path.join(packages,p.pkg));await new Promise(done=>server.listen(0,'127.0.0.1',done));servers.push(server);const origin='http://127.0.0.1:'+server.address().port;
 for(const variant of variants){const context=await browser.newContext();await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());const page=await context.newPage();await page.goto(origin+'/blank');await page.addScriptTag({url:origin+'/'+p.entry});const metadata=await page.evaluate(configureControlled,{kind:p.id});actors.push({id:p.id,variant,metadata,async render(c,id,file){const value=await page.evaluate(controlledExport,{source:c.source,id});if(value.svg){fs.writeFileSync(path.join(out,'svg',id+'.svg'),value.svg);delete value.svg;}if(value.png){fs.writeFileSync(file,Uint8Array.from(value.png));value.png=file;}return value;},async close(){await context.close();}});}
}
async function call(actor,c,phase,round=0,rep=0){
 const id='s'+String(serial++).padStart(6,'0'),file=path.join(out,'png',id+'.png');let row;
 try{
  row=await actor.render(c,id,file);
  if(row.status==='ok'){
   row.inspection=inspect(fs.readFileSync(file),opts.preflight);
   if(!opts.preflight && row.inspection.pixelSha256!==review.cases[c.id].pixels[actor.id]){row.status='stability-failed';row.detail='Output pixels differ from pre-reviewed output';}
  }
 }catch(error){row={...row,status:'contract-failed',detail:String(error)};}
 const data={id,case:c.id,participant:actor.id,variant:actor.variant,phase,round,rep,...row};
 if(opts.preflight){delete data.totalMs;delete data.apiMs;delete data.normalizationMs;}
 fs.appendFileSync(path.join(out,'rows.jsonl'),JSON.stringify(data)+'\n');return data;
}
try{
 const variants=opts.preflight?['Q']:['A','B'];
 for(const p of participants){if(p.id==='flutter')for(const v of variants)actors.push(await nativeActor(v));else await webActors(p,variants);}
 const probes=actors.map(a=>({participant:a.id,variant:a.variant,...a.metadata}));fs.writeFileSync(path.join(out,'actors.json'),JSON.stringify(probes,null,2));
 if(Math.max(...probes.map(p=>p.fontProbeWidth))-Math.min(...probes.map(p=>p.fontProbeWidth))>0.25)throw Error('Font metrics do not match across runtimes; no comparison permitted');
 if(opts.preflight){
  for(const actor of actors){for(let i=0;i<3;i++)await call(actor,manifest.cases[0],'warmup');for(const c of manifest.cases){const row=await call(actor,c,'qualification');console.log('QUALIFY',actor.id,c.id,row.status);}}
 }else{
  const chosen=manifest.cases.filter(c=>review.cases[c.id]?.eligible===true);
  if(!chosen.length)throw Error('No reviewed common inputs');
  for(const c of chosen){if(c.role!=='candidate'||participants.some(p=>review.cases[c.id].checks[p.id]?.pass!==true||!review.cases[c.id].pixels[p.id]))throw Error('Invalid reviewed common case: '+c.id);}
  for(const actor of actors)for(let warm=0;warm<2;warm++)for(const c of chosen){const row=await call(actor,c,'warmup');if(row.status!=='ok')throw Error('Reviewed output/warmup mismatch: '+JSON.stringify(row));}
  const rounds=Number(opts.rounds??5),reps=Number(opts.repetitions??5);if(!Number.isInteger(rounds)||rounds<1||!Number.isInteger(reps)||reps<1)throw Error('Positive integer rounds/repetitions required');context.rounds=rounds;context.repetitions=reps;context.seed=20261029;context.commonCases=chosen.map(c=>c.id);context.aaPolicy='Independent A/B replicas, identical bytes. Geometric mean of per-case A-median/B-median ratios; 10000 paired case-bootstrap draws, seed20261029. 95% interval must stay within0.90..1.10. No relative performance claim if any participant fails. This interval describes sensitivity to the fixed case mix, not population inference.';
  fs.writeFileSync(path.join(out,'context.json'),JSON.stringify(context,null,2));
  for(let round=1;round<=rounds;round++){console.log('CONTROLLED round',round,'/',rounds,'cases',chosen.length);for(let rep=1;rep<=reps;rep++)for(const c of shuffle(chosen))for(const actor of shuffle(actors)){const row=await call(actor,c,'measure',round,rep);if(row.status!=='ok')throw Error('Output contract/stability failed during timing; comparison withheld: '+JSON.stringify(row));}}
 }
 for(const f of sealed)if(sha(fs.readFileSync(f.file))!==f.sha256)throw Error('Artifact changed during run');
 if(!opts.preflight&&JSON.stringify(protocolIdentity(root,roots))!==JSON.stringify(context.producers))throw Error('Producer identity changed during run');
 fs.writeFileSync(path.join(out,'completed.json'),JSON.stringify({complete:true,preflight:!!opts.preflight,finishedAt:new Date().toISOString()},null,2));
}finally{for(const actor of actors)await actor.close();await browser.close();for(const s of servers)await new Promise(done=>s.close(done));}
