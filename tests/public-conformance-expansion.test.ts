import {expect,test} from 'bun:test'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {join,dirname} from 'node:path'
import {gunzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import {readStaticExampleRegistry,expandReviewedPublicCallbacks} from '../unified/public-conformance-expansion.ts'
import manifest from '../corpus/mermaid-public-tests-expanded.json' with {type:'json'}
import legacy from '../corpus/mermaid-public-tests.json' with {type:'json'}
import {useTempDirs} from './helpers/temp-dir.ts'
const temp=useTempDirs('public-expansion-'),hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex')

test('expanded scope preserves every historical callback and all4060 declarations while freezing153 unchanged callbacks',()=>{
  expect(manifest.counts).toEqual({files:368,declarations:4060,eligible:153,eligibleDeclarations:36,upstreamDisabled:18,outsideScope:4006})
  expect(legacy.counts.eligible).toBe(41)
  expect(manifest.eligible.filter(row=>row.publicOperation==='parse')).toHaveLength(102)
  expect(manifest.eligible.filter(row=>row.publicOperation==='detectType')).toHaveLength(32)
  expect(manifest.eligible.filter(row=>row.publicOperation==='render')).toHaveLength(19)
  for(const original of legacy.eligible)expect(manifest.eligible.find(row=>row.id===original.id)).toEqual(original)
  for(const spec of manifest.sourceSpecs)expect(hash(readFileSync(new URL('../'+spec.fixture,import.meta.url)))).toBe(spec.sha256)
  expect(new Set(manifest.eligible.map(row=>row.id)).size).toBe(153)
  expect(new Set(manifest.eligible.map(row=>row.fullName)).size).toBe(153)
  expect(manifest.wholeSuiteConformanceQualified).toBe(false)
})

test('static registry fixture expansion executes no modules, keeps exact names/code hashes and refuses dynamic data',()=>{
  const root=temp.dir(),archive=JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/conformance/static-registry-source.json.gz',import.meta.url))).toString())
  for(const file of archive.files){expect(hash(file.source)).toBe(file.sha256);const path=join(root,file.path);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,file.source)}
  const rows=readStaticExampleRegistry(root)
  expect(rows).toHaveLength(79)
  for(const row of rows){const own=manifest.eligible.find(input=>input.id==='packages/examples/src/example.spec.ts:91#parameter:'+row.id+':'+row.index) as any;expect(own.parameterSourceSha256).toBe(row.sourceSha256);expect(own.parameterCodeSha256).toBe(hash(row.code));expect(own.fullName).toBe('examples should have valid examples '+row.name+': '+row.title)}
  const file=join(root,rows[0]!.path),original=readFileSync(file,'utf8');writeFileSync(file,original.replace("name: 'Flowchart'","name: process.env.SECRET"))
  expect(()=>readStaticExampleRegistry(root)).toThrow('static literal')
  writeFileSync(file,original.replace('A[Christmas]','A[Mutated]'))
  const altered=readStaticExampleRegistry(root)[0]!
  expect(altered.codeSha256).not.toBe(rows[0]!.codeSha256)
  expect(altered.sourceSha256).not.toBe(rows[0]!.sourceSha256)
})
