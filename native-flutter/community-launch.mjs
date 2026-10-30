import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,readdirSync,lstatSync,realpathSync} from 'node:fs';
import {basename,dirname,join,resolve,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const schema='trident-native-png-launch-v1';
const sha256=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const files=directory=>readdirSync(directory).sort().flatMap(name=>{
 const path=join(directory,name),stat=lstatSync(path);
 if(stat.isSymbolicLink())throw Error('Native bundle contains a symlink: '+path);
 return stat.isDirectory()?files(path):stat.isFile()?[path]:[];
}).sort();
/** Create an explicit binding for a prepared native release bundle; never builds it. */
export function nativePngArtifact(bundle,launchFile){
 bundle=realpathSync(bundle);launchFile=resolve(launchFile);
 // Compare physical paths; the manifest does not exist yet, so resolve its directory.
 const manifestRelative=relative(bundle,join(realpathSync(dirname(launchFile)),basename(launchFile)));
 if(!manifestRelative.startsWith('..'+sep)&&manifestRelative!=='..'&&!isAbsolute(manifestRelative))throw Error('Launch manifest must be outside the sealed native bundle');
 const executable=join(bundle,'native_bench'),libapp=join(bundle,'lib/libapp.so');
 const paths=files(bundle);
 if(!paths.includes(executable)||!paths.includes(libapp))throw Error('Native release bundle needs native_bench and lib/libapp.so');
 const manifest={schema,version:'0.3.2',entrypoint:'mermaid_flutter.renderToPng',pixelRatio:1,startupExcludedFromApiClocks:true,executable,files:paths.map(path=>({path,sha256:sha256(path)}))};
 writeFileSync(launchFile,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 const launcher=fileURLToPath(new URL('./community-worker.mjs',import.meta.url));
 return {kind:'jsonl-worker',executable:launcher,args:[launchFile],version:manifest.version,runtime:'Native Linux Flutter release',sha256:sha256(launcher),files:[launcher,fileURLToPath(new URL('./community-launch.mjs',import.meta.url)),launchFile,...paths].map(path=>({path,sha256:sha256(path)})),apiBoundary:manifest.entrypoint+'(source,pixelRatio:1); native process startup excluded'};
}
/** Admit exact bundle bytes before the native child can run. */
export function admitNativeLaunch(file){
 const manifest=JSON.parse(readFileSync(file,'utf8'));
 if(manifest.schema!==schema||manifest.version!=='0.3.2'||manifest.entrypoint!=='mermaid_flutter.renderToPng'||manifest.pixelRatio!==1||manifest.startupExcludedFromApiClocks!==true||typeof manifest.executable!=='string'||!Array.isArray(manifest.files))throw Error('Invalid native PNG launch manifest');
 const executable=resolve(manifest.executable),bundle=dirname(executable);
 if(executable!==join(bundle,'native_bench'))throw Error('Unexpected native PNG executable');
 const expected=manifest.files.map(entry=>entry.path).sort();
 if(new Set(expected).size!==expected.length||JSON.stringify(files(bundle))!==JSON.stringify(expected)||!expected.includes(join(bundle,'lib/libapp.so')))throw Error('Native bundle file inventory differs from its launch manifest');
 for(const entry of manifest.files)if(typeof entry.sha256!=='string'||!/^[a-f0-9]{64}$/.test(entry.sha256)||sha256(entry.path)!==entry.sha256)throw Error('Native bundle digest mismatch: '+entry.path);
 const ambient=process.env.FLUTTER_COMMUNITY_EXECUTABLE&&resolve(process.env.FLUTTER_COMMUNITY_EXECUTABLE);
 if(ambient&&(ambient!==executable&&!(existsSync(ambient)&&realpathSync(ambient)===realpathSync(executable))))throw Error('Ambient native executable differs from the explicit launch manifest');
 return manifest;
}

/** Tie the launch selected by argv to the files sealed by the shared collector. */
export function verifyNativePngArtifact(artifact){
 const launcher=fileURLToPath(new URL('./community-worker.mjs',import.meta.url));
 if(artifact.kind!=='jsonl-worker'||realpathSync(artifact.executable)!==realpathSync(launcher))return;
 if(!Array.isArray(artifact.args)||artifact.args.length!==1||typeof artifact.args[0]!=='string')throw Error('Native PNG binding requires exactly one sealed launch manifest');
 const launchFile=resolve(artifact.args[0]);
 const manifest=admitNativeLaunch(launchFile);
 const required=[{path:launcher,sha256:sha256(launcher)},{path:fileURLToPath(new URL('./community-launch.mjs',import.meta.url)),sha256:sha256(fileURLToPath(new URL('./community-launch.mjs',import.meta.url)))},{path:launchFile,sha256:sha256(launchFile)},...manifest.files];
 for(const file of required)if(!artifact.files?.some(sealed=>resolve(sealed.path)===file.path&&sealed.sha256===file.sha256))throw Error('Native launch file is outside its artifact seal: '+file.path);
 if(artifact.version!==manifest.version)throw Error('Native PNG artifact version differs from its launch manifest');
}
