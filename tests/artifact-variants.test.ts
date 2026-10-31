import { test, expect } from 'bun:test'
import { createHash } from 'node:crypto'
import { writeFileSync,readFileSync } from 'node:fs'
import { join } from 'node:path'
import { useTempDirs } from './helpers/temp-dir.ts'
import { readArtifactVariants,selectArtifactVariant } from '../unified/artifact-variants.ts'
import { readDocsResources,routeDocsResource } from '../unified/docs-resources.ts'
const dirs=useTempDirs('variants-'), hash=(b:string|Uint8Array)=>createHash('sha256').update(b).digest('hex')
test('explicit frozen CLI selection preserves project identity and never substitutes a primary transport',()=>{
 const root=dirs.dir(),file=join(root,'cli.mjs');writeFileSync(file,'// frozen CLI')
 const cli={kind:'cli' as const,executable:process.execPath,sha256:hash(readFileSync(process.execPath)),version:'1',args:[file],outputBindings:{png:{args:[file],input:'stdin' as const}},files:[{path:file,sha256:hash(readFileSync(file))}]}
 const peer={node:{id:'fixture/project',roles:['renderer'],outputs:['svg','png'],benchmark:{adapter:'declared',outputs:['svg']}},artifact:{kind:'node' as const,module:file,sha256:hash(readFileSync(file)),files:[{path:file,sha256:hash(readFileSync(file))}],version:'1',additionalCli:[{id:'native',outputs:['png'],artifact:cli}]}}
 const selected=selectArtifactVariant(peer,'png',[{project:peer.node.id,output:'png',variant:'native'}])
 expect(selected.node.id).toBe(peer.node.id);expect(selected.artifact!.kind).toBe('cli');expect(selected.artifact!.transportVariant).toBe('native');expect(peer.artifact.kind).toBe('node')
 expect(()=>selectArtifactVariant(peer,'svg',[{project:peer.node.id,output:'svg',variant:'native'}])).toThrow('requested output')
 expect(()=>selectArtifactVariant(peer,'png',[{project:peer.node.id,output:'png',variant:'missing'}])).toThrow('requested output')
 writeFileSync(file,'changed');expect(()=>selectArtifactVariant(peer,'png',[{project:peer.node.id,output:'png',variant:'native'}])).toThrow()
})
test('variant manifest rejects duplicate lane choices',()=>{const p=join(dirs.dir(),'choices.json');writeFileSync(p,JSON.stringify([{project:'p',output:'svg',variant:'a'},{project:'p',output:'svg',variant:'b'}]));expect(()=>readArtifactVariants(p)).toThrow('Duplicate')})
test('exact pinned image URLs are served from authenticated local bytes and other remote requests stay blocked',async()=>{
 const resources=readDocsResources();expect(resources.resources.length).toBeGreaterThan(0)
 const row=resources.resources[0];let response:any,aborted=false
 await routeDocsResource({request:()=>({url:()=>row.url}),fulfill:async(value:any)=>{response=value},abort:async()=>{aborted=true}} as any,'http://127.0.0.1:123',resources)
 expect(hash(response.body)).toBe(row.sha256);expect(aborted).toBe(false)
 await routeDocsResource({request:()=>({url:()=>row.url+'?unfrozen'}),abort:async()=>{aborted=true}} as any,'http://127.0.0.1:123',resources);expect(aborted).toBe(true)
})

import { harnessVerificationPlan } from '../unified/harness-verification.ts'
test('the unscored verification plan covers every required mechanism with six projects',()=>{
 const plan=harnessVerificationPlan()
 expect(plan.projects).toHaveLength(6);expect(plan.jobs).toHaveLength(16)
 expect(plan.plannedOutputCalls).toBe(56);expect(plan.referenceTerminalScore).toBe(false)
 expect(plan.jobs.filter(job=>job.project==='Latias94/merman').map(job=>job.id).sort()).toEqual(['wasm-svg','native-node-engine','native-svg-cli','native-png-cli','native-terminal-cli'].sort())
 expect(plan.purpose).toContain('not ecosystem ranking')
})
