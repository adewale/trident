import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {bundleAddon} from './bundle-addon.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const out=path.resolve(process.argv[2]);
fs.mkdirSync(out);
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const run=(cmd,args,cwd)=>execFileSync(cmd,args,{cwd,stdio:'inherit',env:process.env});
const receipt={startedAt:new Date().toISOString(),baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),bundles:[]};
receipt.zenuml=await bundleAddon(out);
for(const [pkg,global] of [['beautiful-mermaid','beautifulMermaid'],['zombie-mermaid','zombieMermaid']]){
  const base=path.join(import.meta.dirname,'packages/node_modules',pkg),entry=path.join(base,'dist/index.js');
  const file=path.join(out,pkg+'.js');
  const registration=pkg==='zombie-mermaid'?`;import ELK from ${JSON.stringify(path.join(import.meta.dirname,'packages/node_modules/elkjs/lib/elk.bundled.js'))};import {registerElk} from ${JSON.stringify(entry)};registerElk(ELK);`:'';
  await build({stdin:{contents:`export * from ${JSON.stringify(entry)}`+registration,resolveDir:root},bundle:true,platform:'browser',format:'iife',globalName:global,target:'chrome154',outfile:file,minify:false,metafile:true}).then(result=>fs.writeFileSync(file+'.meta.json',JSON.stringify(result.metafile,null,2)));
  receipt.bundles.push({pkg,version:JSON.parse(fs.readFileSync(base+'/package.json')).version,entry,entrySha256:sha(entry),bundle:file,sha256:sha(file)});
}
const dart=process.env.FLUTTER_ROOT?process.env.FLUTTER_ROOT+'/bin/dart':'dart';
const dartRoot=path.join(import.meta.dirname,'dart');
run(dart,['--suppress-analytics','pub','get','--offline'],dartRoot);
run(dart,['--suppress-analytics','compile','exe','worker.dart','-o',path.join(out,'mermaid-dart')],dartRoot);
receipt.dart={sdk:execFileSync(dart,['--version'],{encoding:'utf8'}).trim(),source:sha(dartRoot+'/worker.dart'),lock:sha(dartRoot+'/pubspec.lock'),executable:sha(out+'/mermaid-dart')};
const app=out+'/native-app';
fs.mkdirSync(app);
for(const name of ['linux','pubspec.yaml','pubspec.lock'])fs.cpSync(root+'/native-flutter/app/'+name,app+'/'+name,{recursive:true,filter:file=>!file.includes('/ephemeral')});
fs.mkdirSync(app+'/lib');fs.copyFileSync(import.meta.dirname+'/flutter_worker.dart',app+'/lib/main.dart');
run('flutter',['pub','get','--offline'],app);
run('flutter',['build','linux','--release','--target','lib/main.dart'],app);
receipt.flutter={sdk:JSON.parse(execFileSync('flutter',['--version','--machine'],{encoding:'utf8'})),source:sha(app+'/lib/main.dart'),lock:sha(app+'/pubspec.lock'),bundle:app+'/build/linux/x64/release/bundle'};
receipt.flutter.outputs=fs.readdirSync(receipt.flutter.bundle,{recursive:true}).filter(f=>fs.statSync(receipt.flutter.bundle+'/'+f).isFile()).map(file=>({file,sha256:sha(receipt.flutter.bundle+'/'+file)}));
receipt.finishedAt=new Date().toISOString();
fs.writeFileSync(out+'/build.json',JSON.stringify(receipt,null,2));
