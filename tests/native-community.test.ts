import { expect, test } from 'bun:test'
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { Resvg } from '@resvg/resvg-js'
import { nativePngArtifact, admitNativeLaunch } from '../native-flutter/community-launch.mjs'
import { prepareNativeCommunity } from '../native-flutter/prepare-community.ts'
import { verifySupport } from '../unified/support-verification.ts'
import { runExternalCommunity } from '../unified/community-external.ts'
import { parseOptions } from '../unified/options.ts'
import { verifyProvidedCommunityArtifact } from '../unified/community.ts'
import type { CommunityArtifact } from '../unified/community-types.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('trident-native-binding-')
function fixture(settings: { delay?: number; pixelRatio?: number; startupExcluded?: boolean; perCallReceipts?: boolean } = {}) {
  const root = temp.dir(), bundle = join(root, 'bundle')
  mkdirSync(join(bundle, 'lib'), { recursive: true })
  writeFileSync(join(bundle, 'lib/libapp.so'), 'synthetic transport fixture, not a Flutter library')
  const png = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="white"/><circle cx="8" cy="8" r="4" fill="black"/></svg>').render().asPng().toString('base64')
  writeFileSync(join(bundle, 'native_bench'), `#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path');
const job=JSON.parse(fs.readFileSync(process.env.FLUTTER_COMMUNITY_JOB));const dir=process.env.FLUTTER_COMMUNITY_DIR;
(async()=>{fs.writeFileSync(process.env.FLUTTER_COMMUNITY_RAW,'');
 await new Promise(r=>setTimeout(r,${settings.delay ?? 0}));
 fs.writeFileSync(path.join(dir,'runtime.json'),JSON.stringify({runtime:'native Linux Flutter',release:true,entrypoint:'mermaid_flutter.renderToPng',packageVersion:'0.3.2',pixelRatio:${settings.pixelRatio ?? 1},startupExcludedFromApiClocks:${settings.startupExcluded ?? true}}));
 for(let sequence=0;sequence<job.workloads.length;sequence++){
 const w=job.workloads[sequence];let row={sequence,workload:w.id,release:true};
 if(w.source.startsWith('This is deliberately')||w.source.includes('--> -->'))row={...row,status:'error',rejected:true,failureStage:'public-api',detail:'Synthetic source rejection'};
 else {const png=path.join(dir,'case-'+sequence+'.png');fs.writeFileSync(png,Buffer.from('${png}','base64'));row={...row,status:'ok',png,firstPng:png,firstMs:123,outputBytes:fs.statSync(png).size};}
 if(${settings.perCallReceipts ?? false}){
 const started={schema:'trident-invocation-evidence-v1',attemptId:job.invocationRunId+':'+sequence+':0',identity:w.invocationIdentity,state:'started',startedAt:new Date().toISOString(),finishedAt:null,recordedAt:new Date().toISOString(),durationMs:null,output:null,detail:'Synthetic scheduled native call'};
 const ledger=path.join(dir,'public-invocations.jsonl'),append=value=>{const fd=fs.openSync(ledger,'a');fs.writeSync(fd,JSON.stringify(value)+'\\n');fs.fsyncSync(fd);fs.closeSync(fd)};
 append(started);append({...started,state:row.status==='ok'?'returned':'public-error',durationMs:1,finishedAt:new Date().toISOString(),recordedAt:new Date().toISOString(),...(row.status==='ok'?{outputPath:row.png,outputBytes:row.outputBytes}:{}),detail:'Synthetic actual native outcome'});
 }
 fs.appendFileSync(process.env.FLUTTER_COMMUNITY_RAW,JSON.stringify(row)+'\\n');
 while(!fs.existsSync(path.join(dir,'ack-'+sequence)))await new Promise(r=>setTimeout(r,5));
}})().catch(e=>{console.error(e);process.exitCode=1});
`)
  chmodSync(join(bundle, 'native_bench'), 0o755)
  return { root, bundle }
}

test('an explicit native launch rejects changed bundle bytes and conflicting ambient executables before launch', () => {
  const { root, bundle } = fixture(), manifest = join(root, 'launch.json')
  const artifact = nativePngArtifact(bundle, manifest) as CommunityArtifact
  expect(artifact.args).toEqual([manifest])
  // The binding records the bundle's physical path (macOS temporary paths are symlinks).
  expect(admitNativeLaunch(manifest).executable).toBe(realpathSync(join(bundle, 'native_bench')))
  verifyProvidedCommunityArtifact(artifact)
  const worker = artifact.executable!
  const result = spawnSync('node', [worker, manifest, join(root, 'no-job'), join(root, 'must-not-exist')], { encoding: 'utf8', env: { ...process.env, FLUTTER_COMMUNITY_EXECUTABLE: '/unsealed/other-worker' } })
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('explicit launch manifest')
  expect(existsSync(join(root, 'must-not-exist'))).toBe(false)
  writeFileSync(join(bundle, 'lib/libapp.so'), 'changed compiled library')
  expect(() => admitNativeLaunch(manifest)).toThrow('digest mismatch')
  expect(() => verifyProvidedCommunityArtifact(artifact)).toThrow('digest mismatch')
})

test('native binding flows through the ordinary frozen support collector with raster scope and separate invalid controls', async () => {
  const { root, bundle } = fixture(), prepared = prepareNativeCommunity(bundle, join(root, 'prepared'))
  const reportDir = join(root, 'verification')
  await verifySupport(prepared.prepared, reportDir, { projects: ['pub:mermaid_flutter'] })
  const report = JSON.parse(readFileSync(join(reportDir, 'report.json'), 'utf8'))
  expect(report.projects[0].project).toBe('pub:mermaid_flutter')
  const output = report.projects[0].outputs[0]
  expect(output).toMatchObject({ plannedInputs: 6, passed: 6, controlCounts: { planned: 2, passed: 2, failed: 0, blocked: 0, missing: 0 } })
  expect(output.observations.every((row: any) => row.metrics.qualification === 'decoded-raster-content')).toBe(true)
  expect(output.observations.every((row: any) => !row.samplesMs && !row.metrics.firstMs)).toBe(true)
  expect(report.limits).toContain('no label or topology credit')
  const argv = prepared.artifact.args!
  expect(argv).toHaveLength(1)
  const node = JSON.parse(readFileSync(prepared.prepared, 'utf8'))[0]
  const rows = await runExternalCommunity(node, [{ id: 'after-restore', family: 'flowchart', source: 'flowchart LR; A-->B', expectedLabels: ['A', 'B'], features: [], provenance: 'Synthetic transport invocation' }], 'png', 1, parseOptions(['--out', join(root, 'another-job'), '--profile', 'smoke']))
  expect(rows[0]).toMatchObject({ status: 'passed', runtime: 'Native Linux Flutter release' })
  expect(rows[0]!.metrics?.qualification).toBe('decoded-raster-content')
}, 60_000)


test('repointing a saved native manifest cannot launch a bundle outside its artifact seal', () => {
  const a = fixture(), b = fixture()
  const sealed = nativePngArtifact(a.bundle, join(a.root, 'launch.json')) as CommunityArtifact
  const other = nativePngArtifact(b.bundle, join(b.root, 'launch.json')) as CommunityArtifact
  expect(() => verifyProvidedCommunityArtifact({ ...sealed, args: other.args })).toThrow('outside its artifact seal')
  writeFileSync(join(a.bundle, 'added-resource'), 'not sealed')
  expect(() => admitNativeLaunch(sealed.args![0])).toThrow('file inventory differs')
})

test('native runtime facts may follow an empty startup ledger but must match claimed options before rows are accepted', async () => {
  for (const settings of [{ delay: 400 }, { pixelRatio: 2 }, { startupExcluded: false }]) {
    const { root, bundle } = fixture(settings), artifact = nativePngArtifact(bundle, join(root, 'launch.json')) as CommunityArtifact
    const prepared = { node: { id: 'fixture/native', outputs: ['png'], roles: ['renderer'] }, artifact }
    const rows = await runExternalCommunity(prepared, [{ id: 'startup', family: 'flowchart', source: 'flowchart LR; A-->B', features: [], provenance: 'Synthetic transport fixture' }], 'png', 1, parseOptions(['--out', join(root, 'job'), '--profile', 'smoke']))
    expect(rows[0]!.status).toBe(settings.delay ? 'passed' : 'blocked')
  }
}, 15_000)


test('a native error receipt remains one real attempt instead of gaining a bridge-created phantom call', async () => {
  const { root, bundle } = fixture({ perCallReceipts: true }), artifact = nativePngArtifact(bundle, join(root, 'launch.json')) as CommunityArtifact
  const rows = await runExternalCommunity({ node: { id: 'fixture/native', outputs: ['png'], roles: ['renderer'] }, artifact }, [{ id: 'invalid', family: 'flowchart', source: 'graph LR; --> -->', features: [], intent: 'negative-admission', provenance: 'Synthetic per-call error ownership control' }], 'png', 1, parseOptions(['--out', join(root, 'job'), '--profile', 'smoke']))
  const frames = new InvocationJournal(rows[0]!.metrics!.invocationDirectory as string).records()
  expect(frames.filter(frame => frame.state === 'started')).toHaveLength(1)
  expect(frames.filter(frame => frame.state === 'public-error')).toHaveLength(1)
  expect(new Set(frames.map(frame => frame.attemptId)).size).toBe(1)
  expect(rows[0]!.metrics!.invocationId).toBe(frames[0]!.attemptId)
})
