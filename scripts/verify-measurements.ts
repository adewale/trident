import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { freshOutputOutside } from '../unified/measurement-replay.ts'
import { runMeasurementControls } from '../unified/admission-controls.ts'

const root = resolve(import.meta.dir, '..')
const files = ['output-evidence', 'terminal-output-measurements', 'output-measurements', 'measurement-contracts', 'measurement-replay', 'observer-controls', 'internal-invocations', 'external-invocations', 'docs-png-transport-ownership', 'qualified-timing-collection', 'native-timing-report', 'recheck-observations'].map(name => 'tests/' + name + '.test.ts')
const help = 'verify:measurements --plan | --out FRESH_DIRECTORY\nExecutes the bounded fixture matrix for measurement contracts, observer controls, Node/CLI/native-worker transports, raw-output replay and timing qualification. No ecosystem acquisition or renderer campaign. Success qualifies these harness fixtures, not every adapter or drawing representation.'
export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log(help); return }
  const inputs = files.map(file => ({ file, sha256: evidenceBytesDigest(readFileSync(join(root, file))) }))
  if (args.length === 1 && args[0] === '--plan') { console.log(JSON.stringify({ scope: help, inputs }, null, 2)); return }
  if (args.length !== 2 || args[0] !== '--out' || !args[1] || args[1].startsWith('--')) throw Error(help)
  const out = resolve(args[1])
  freshOutputOutside(root, out)
  mkdirSync(out, { recursive: true })
  const result = spawnSync(process.execPath, ['test', '--timeout', '30000', ...files], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  const output = (result.stdout ?? '') + '\n' + (result.stderr ?? '')
  writeFileSync(join(out, 'tests.log'), output, { flag: 'wx' })
  const completed = /Ran (\d+) tests? across (\d+) files?\./.exec(output)
  const controls = await runMeasurementControls()
  writeFileSync(join(out, 'observer-controls.json'), JSON.stringify(controls, null, 2) + '\n', { flag: 'wx' })
  const passed = controls.qualified && result.status === 0 && !result.signal && !result.error && !!completed && Number(completed[1]) > 0 && Number(completed[2]) === files.length && /\b0 fail\b/.test(output)
  const receipt = { schema: 'trident-measurement-verification-v2', scope: help, harnessVerified: passed,
    qualifiedInstrumentScopes: controls.qualified ? controls.scope : [],
    exclusions: ['Catalogue adapter qualification requires actual frozen public-artifact invocation controls.', 'These finite controls do not qualify arbitrary SVG/terminal drawing representations or unseen PNG semantics.', 'Comparative timing requires its own actual workload, per-call evidence and A/A controls.'],
    tests: completed ? Number(completed[1]) : null, files: inputs, logSha256: evidenceBytesDigest(output), exitCode: result.status, signal: result.signal, error: result.error ? String(result.error) : null }
  writeFileSync(join(out, 'verification.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ out, harnessVerified: passed, qualifiedInstrumentScopes: receipt.qualifiedInstrumentScopes, tests: receipt.tests }))
  process.exitCode = passed ? 0 : result.status && result.status > 0 ? result.status : 1
}
if (import.meta.main) await main()
