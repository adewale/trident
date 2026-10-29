import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { portableCases, layoutBackendCases } from './historical-cohorts.ts'

const directory = resolve(process.argv[2] ?? 'replay')
const entry = resolve(process.argv[3] ?? 'agentic-renderer/dist/index.js')
const node = process.env.QUALIFICATION_NODE ?? 'node'
mkdirSync(directory, { recursive: true })
const cases = layoutBackendCases(portableCases().filter(testCase => ['class', 'er'].includes(testCase.family)), ['elk', 'agentic'])
const rows = []
for (const [index, testCase] of cases.entries()) {
  const prefix = resolve(directory, String(index))
  writeFileSync(prefix + '-job.json', JSON.stringify({ entry, testCase, prefix }, null, 2) + '\n')
  const run = spawnSync(node, [resolve('requalify-worker.mjs'), prefix + '-job.json'], { encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 })
  writeFileSync(prefix + '.log', run.stdout + run.stderr)
  const result = JSON.parse(readFileSync(prefix + '-result.json', 'utf8'))
  rows.push(result)
  console.log(testCase.id, result.passed ? 'passed' : 'failed', result.qualification?.evidence, result.certification?.checks?.operations)
}
writeFileSync(directory + '/summary.json', JSON.stringify({
  rendererHead: '53319dbb976dae1865e19f7faca49464ee8e8557',
  observerHead: '31a0519660127fca5107da838723c95fc8e3e2b4',
  mode: 'Untimed correctness requalification; one fresh public Node process per case and backend; SVG and complete enumerable receipt consumed',
  authoredCohortRevision: '2401d09f1c73b1c650445858e5640127368b21c6',
  historicalObservations: 'Preserved unchanged. This observer result makes no latency or memory comparison.',
  entry, rows,
}, null, 2) + '\n')
if (rows.some(row => !row.passed)) process.exitCode = 1
