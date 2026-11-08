import { expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { verifiedNativeBundle } from '../unified/davebench-native-png.ts'

test('native collection accepts a relocated complete receipt and rejects altered assets, source bindings and smoke', () => {
  const root = mkdtempSync(join(tmpdir(), 'native-bundle-'))
  try {
    execFileSync('python3', ['-c', `
import sys
from pathlib import Path
sys.path.insert(0,sys.argv[1])
from bundle import sources, files, identity, pin, write, MANIFEST, SMOKE, ADMISSION_CHECKS
root=Path(sys.argv[2]); expected=pin()
for name in ['native_bench','lib/libapp.so','lib/libflutter_linux_gtk.so','data/icudtl.dat','data/flutter_assets/AssetManifest.bin']:
 p=root/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(name.encode())
entries=files(root)
sdk={'frameworkVersion':expected['flutter'],'frameworkRevision':expected['frameworkRevision'],'engineRevision':expected['engineRevision'],'dartSdkVersion':expected['dart']}
write(root/MANIFEST,{'protocol':'native-flutter-release-v1','sdk':sdk,'sources':sources(),'files':entries,'bundleSha256':identity(entries),'target':expected['target'],'packageVersion':expected['packageVersion']})
write(root/SMOKE,{'protocol':'native-flutter-smoke-v1','bundleSha256':identity(entries),'result':'completed','admissionChecks':ADMISSION_CHECKS,'ready':{'mode':'release','package':expected['package'],'version':expected['packageVersion'],'runtime':{'dart':expected['dart'],'platform':'linux'}}})
`, join(import.meta.dirname, '../native-flutter'), root])
    const manifest = verifiedNativeBundle(root)
    expect(manifest.packageVersion).toBe('0.3.2')
    const asset = join(root, 'data/icudtl.dat'), original = readFileSync(asset)
    writeFileSync(asset, 'changed')
    expect(() => verifiedNativeBundle(root)).toThrow()
    writeFileSync(asset, original)
    const build = join(root, 'trident-build.json'), buildBytes = readFileSync(build)
    writeFileSync(build, JSON.stringify({ ...manifest, sdk: { ...manifest.sdk, dartSdkVersion: '0.0.0' } }))
    expect(() => verifiedNativeBundle(root)).toThrow()
    writeFileSync(build, JSON.stringify({ ...manifest, sources: {} }))
    expect(() => verifiedNativeBundle(root)).toThrow()
    writeFileSync(build, buildBytes)
    const smoke = join(root, 'trident-smoke.json'), receipt = JSON.parse(readFileSync(smoke, 'utf8'))
    writeFileSync(smoke, JSON.stringify({ ...receipt, ready: { ...receipt.ready, runtime: { ...receipt.ready.runtime, platform: 'web' } } }))
    expect(() => verifiedNativeBundle(root)).toThrow()
    writeFileSync(smoke, JSON.stringify({ ...receipt, admissionChecks: [...receipt.admissionChecks].reverse() }))
    expect(() => verifiedNativeBundle(root)).not.toThrow()
    writeFileSync(smoke, JSON.stringify({ ...receipt, admissionChecks: receipt.admissionChecks.map(() => 'valid') }))
    expect(() => verifiedNativeBundle(root)).toThrow()
    writeFileSync(smoke, JSON.stringify({ ...receipt, admissionChecks: ['valid'] }))
    expect(() => verifiedNativeBundle(root)).toThrow()
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('verification comments preserve a compiled bundle; compiled input edits still reject it', () => {
  const result = execFileSync('python3', ['-B', '-c', `
import sys, tempfile, shutil
from pathlib import Path
sys.path.insert(0,sys.argv[1]); import bundle as m
with tempfile.TemporaryDirectory() as directory:
 root=Path(directory); original=m.ROOT; source=root/'source'; source.mkdir()
 for name in list(m.sources())+list(m.verification_sources()):
  target=source/name; target.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(original/name,target)
 m.ROOT=source; output=root/'bundle'; output.mkdir(); expected=m.pin()
 for name in ['native_bench','lib/libapp.so','lib/libflutter_linux_gtk.so','data/icudtl.dat','data/flutter_assets/AssetManifest.bin']:
  target=output/name; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(name.encode())
 entries=m.files(output); sdk={'frameworkVersion':expected['flutter'],'frameworkRevision':expected['frameworkRevision'],'engineRevision':expected['engineRevision'],'dartSdkVersion':expected['dart']}
 # Exercise an older receipt which mixed build and verification inputs.
 m.write(output/m.MANIFEST,{'protocol':'native-flutter-release-v1','sdk':sdk,'sources':{**m.sources(),**m.verification_sources()},'files':entries,'bundleSha256':m.identity(entries),'target':expected['target'],'packageVersion':expected['packageVersion']})
 m.verify(output,require_smoke=False)
 with (source/'smoke.py').open('a') as stream: stream.write('\\n# Editorial comment\\n')
 m.verify(output,require_smoke=False)
 dart=next((source/'app/lib').rglob('*.dart'))
 with dart.open('a') as stream: stream.write('\\n// Compiled source changes\\n')
 try: m.verify(output,require_smoke=False)
 except ValueError: print('compiled changes rejected')
 else: raise AssertionError('compiled source mutation was accepted')
`, join(import.meta.dirname, '../native-flutter')], { encoding: 'utf8' })
  expect(result.trim()).toBe('compiled changes rejected')
})
