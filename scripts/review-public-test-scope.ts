/** Source-only regeneration. Reads literal pinned tests/registry data and hashes
 * the collector; it invokes no original test callback, parser or renderer. */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { inventoryPublicTests } from '../unified/public-conformance-inventory.ts'
import { readStaticExampleRegistry } from '../unified/public-conformance-expansion.ts'

const digest=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex')
export function reviewedExpandedPublicArtifacts(upstream:string,root=resolve(import.meta.dir,'..')){
  const inventory=inventoryPublicTests(upstream,'expanded-public'),legacy=JSON.parse(readFileSync(join(root,'corpus/mermaid-public-tests.json'),'utf8'))
  const outputs=new Map<string,string|Buffer>()
  const sourceSpecs=[...new Set(inventory.callbacks.map(row=>row.path))].map(path=>{
    const existing=legacy.sourceSpecs.find((row:any)=>row.path===path),fixture=existing?.fixture??'tests/fixtures/conformance/'+path.split('/').at(-1)+'.txt',source=readFileSync(join(upstream,path),'utf8')
    outputs.set(fixture,source)
    return{path,fixture,sha256:digest(source)}
  })
  const blob=(path:string)=>{const bytes=readFileSync(join(root,path));return'100644 blob '+createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')+'\t'+path}
  const manifest={schema:inventory.schema,protocol:inventory.protocol,scopeSelection:'expanded-public',sourceCommit:inventory.sourceCommit,scope:inventory.scope,counts:inventory.counts,scopeCounts:inventory.scopeCounts,host:legacy.host,wholeSuiteConformanceQualified:false,wholeSuiteBlocker:inventory.wholeSuiteBlocker,sourceSpecs,eligible:inventory.callbacks,censusFiles:inventory.files,scopeReview:inventory.scopeReview,inventorySha256:digest(JSON.stringify(inventory)),publicBoundaries:legacy.publicBoundaries,publicModuleResolution:{specifier:'mermaid',importer:'packages/examples/src/example.spec.ts',publicSourceEntry:'packages/mermaid/src/mermaid.ts',sha256:digest(readFileSync(join(upstream,'packages/mermaid/src/mermaid.ts')))},publicBindings:[{producer:blob('unified/public-conformance-binding.mjs'),collectorProducer:blob('unified/public-conformance.ts'),rawCapture:'durable-public-return-json-v1'}]}
  outputs.set('corpus/mermaid-public-tests-expanded.json',JSON.stringify(manifest)+'\n')
  const paths=[...new Set(['packages/examples/src/index.ts',...readStaticExampleRegistry(upstream).map(row=>row.path)])]
  outputs.set('tests/fixtures/conformance/static-registry-source.json.gz',gzipSync(JSON.stringify({schema:'trident-static-public-registry-source-v1',sourcePin:inventory.sourceCommit,files:paths.map(path=>{const source=readFileSync(join(upstream,path),'utf8');return{path,source,sha256:digest(source)}})})+'\n'))
  return{inventory,outputs}
}
if(import.meta.main){
  const args=process.argv.slice(2),check=args.includes('--check'),source=args.find(arg=>arg!=='--check')
  if(!source)throw Error('Usage: bun scripts/review-public-test-scope.ts PINNED_SOURCE [--check]')
  const root=resolve(import.meta.dir,'..'),{inventory,outputs}=reviewedExpandedPublicArtifacts(resolve(source),root)
  for(const[path,bytes]of outputs){const file=join(root,path);if(check){if(!readFileSync(file).equals(Buffer.from(bytes)))throw Error('Stale original public source artifact: '+path)}else writeFileSync(file,bytes)}
  console.log(JSON.stringify({...inventory.counts,scopeSelection:'expanded-public',check,parserInvocations:0,rendererInvocations:0}))
}
