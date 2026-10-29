import { expect, test } from 'bun:test'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('trident-native-binding-')
function fixture() {
  const root = temp.dir(), bundle = join(root, 'bundle')
  mkdirSync(join(bundle, 'lib'), { recursive: true })
  writeFileSync(join(bundle, 'lib/libapp.so'), 'synthetic transport fixture, not a Flutter library')
  const png = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="white"/><circle cx="8" cy="8" r="4" fill="black"/></svg>').render().asPng().toString('base64')
  writeFileSync(join(bundle, 'native_bench'), `#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path');
const job=JSON.parse(fs.readFileSync(process.env.FLUTTER_COMMUNITY_JOB));const dir=process.env.FLUTTER_COMMUNITY_DIR;
fs.writeFileSync(path.join(dir,'runtime.json'),JSON.stringify({release:true,entrypoint:'mermaid_flutter.renderToPng',packageVersion:'0.3.2'}));
(async()=>{for(let sequence=0;sequence<job.workloads.length;sequence++){
 const w=job.workloads[sequence];let row={sequence,workload:w.id,release:true};
 if(w.source.startsWith('This is deliberately')||w.source.includes('--> -->'))row={...row,status:'error',rejected:true,failureStage:'public-api',detail:'Synthetic source rejection'};
 else {const png=path.join(dir,'case-'+sequence+'.png');fs.writeFileSync(png,Buffer.from('${png}','base64'));row={...row,status:'ok',png,firstPng:png,firstMs:123,outputBytes:fs.statSync(png).size};}
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
  expect(admitNativeLaunch(manifest).executable).toBe(join(bundle, 'native_bench'))
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
  await verifySupport(prepared.prepared, reportDir, { catalog: prepared.catalog, projects: ['orestesgaolin/mermaid'] })
  const report = JSON.parse(readFileSync(join(reportDir, 'report.json'), 'utf8'))
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
