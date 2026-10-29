import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

// The published addon uses bare npm imports; a browser needs a resolved bundle.
export async function bundleAddon(assets){
  const source=path.resolve(import.meta.dirname,'../node_modules/@mermaid-js/mermaid-zenuml');
  const entry=source+'/dist/mermaid-zenuml.core.mjs',root=assets+'/zenuml-addon';
  fs.mkdirSync(root,{recursive:true});
  const file=root+'/index.mjs';
  const built=await build({entryPoints:[entry],bundle:true,platform:'browser',format:'esm',target:'chrome154',outfile:file,metafile:true});
  fs.writeFileSync(root+'/meta.json',JSON.stringify(built.metafile,null,2));
  const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  return {version:JSON.parse(fs.readFileSync(source+'/package.json')).version,root,entry:'index.mjs',file,sha256:sha(file),sourceEntry:entry,sourceSha256:sha(entry)};
}
