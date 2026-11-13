import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { readDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { reassessDrawingRun } from '../scripts/reassess-drawing-results.ts'
import { byteDigest } from '../portable/artifacts.ts'
import { planDigest } from '../unified/campaign-plan.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('drawing-capture-')
const release = join(import.meta.dirname, '../results/release')

test('committed capture owns every returned output and reproduces terminal assessments', async () => {
  const published = JSON.parse(readFileSync(join(release, 'drawing-correctness.json'), 'utf8'))
  const capture = published.collection.captureArchive, archive = join(release, capture.path)
  expect(byteDigest(archive)).toBe(capture.sha256)
  expect(statSync(archive).size).toBe(capture.bytes)
  const raw = JSON.parse(execFileSync('tar', ['-xOf', archive, capture.root + '/results.json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }))
  const members = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim().split('\n')
  const expectedMembers = [capture.root + '/', capture.root + '/results.json', capture.root + '/outputs/', ...new Set<string>(raw.outputs.map((record: any) => capture.root + '/outputs/' + record.outputSha256 + '.gz'))]
  expect([...members].sort()).toEqual(expectedMembers.sort())
  const directory = temporary.dir()
  execFileSync('tar', ['-xzf', archive, '-C', directory])
  const root = join(directory, capture.root), key = (row: any) => JSON.stringify([row.project, row.format, row.caseId])
  const cases = drawingCases().filter(input => raw.corpus.ids.includes(input.id))
  expect(raw.corpus.ids).toEqual(published.corpus.ids)
  expect(raw.corpus.contractSha256).toBe(planDigest(cases.map(({ id, source, expected, sourceGaps }) => ({ id, source, expected, sourceGaps }))))
  const rows = new Map<string, any>(raw.rows.map((row: any) => [key(row), row]))
  expect(rows.size).toBe(raw.rows.length)
  const owned = new Set<string>()
  for (const record of raw.outputs) {
    expect(owned.has(key(record))).toBe(false)
    owned.add(key(record))
    expect(rows.has(key(record))).toBe(true)
    const input = cases.find(input => input.id === record.caseId)!
    readDrawingOutput(root, record, input.source)
  }
  expect(raw.outputs.length).toBe(published.collection.returnedOutputs)
  for (const row of raw.rows) expect(owned.has(key(row))).toBe(!['renderer-failure', 'unrun'].includes(row.status))
  let accounted = 0
  for (const lane of published.results) for (const [status, ids] of Object.entries(lane.caseOutcomes)) for (const caseId of ids as string[]) {
    expect(rows.get(key({ ...lane, caseId }))?.status).toBe(status)
    accounted++
  }
  expect(accounted).toBe(raw.rows.length)
  const reassessed = await reassessDrawingRun(raw, root, ['terminal'])
  // The current observer no longer reports a label wrapped across rows outside a walled
  // box as missing: its words are present but unowned, so the case is unknown. These are
  // the only rows of the committed capture that this changes.
  const unowned = new Set([
    ['dfadler/zombie-mermaid', 'drawing:0dbd28f2f1c494cc'], ['dfadler/zombie-mermaid', 'drawing:89e9eb6aebb72128'],
    ['Dicklesworthstone/frankenmermaid', 'drawing:1c0f33b5035768f2'], ['Dicklesworthstone/frankenmermaid', 'drawing:89e9eb6aebb72128'],
    ['kitlangton/merman', 'drawing:767a3f8c3e47e0bd'], ['wevm/ondine', 'drawing:0dbd28f2f1c494cc'], ['wevm/ondine', 'drawing:29fc1dab07164509'],
    ['wevm/ondine', 'drawing:89e9eb6aebb72128'], ['wevm/ondine', 'drawing:9cdc849ecf29b4d2'], ['wevm/ondine', 'drawing:cd771fca2659a460'],
  ].map(([project, caseId]) => key({ project, format: 'terminal', caseId })))
  for (const row of reassessed.rows) {
    if (!unowned.has(key(row))) { expect(row.status).toBe(rows.get(key(row)).status); continue }
    expect([rows.get(key(row)).status, row.status]).toEqual(['incorrect', 'unknown'])
    expect(row.reason).toContain('ownership cannot be established')
  }
  expect(reassessed.updatedAt).toBe(raw.updatedAt)
  expect(reassessed.reassessment.renderersInvoked).toBe(false)
}, 30000)
