import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { reduxUsecaseSourcePolicy, sourceThemePalette } from '../fidelity/theme-source-policy.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ executablePath: chromiumExecutable, headless: true }) })
afterAll(async () => { await browser?.close() })
const directory = new URL('./fixtures/domain-facts/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8')) as any[]
const docs = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8')) as any[]
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as any[]

// Expectations below depend only on reviewed source contracts and the separate
// literal/formula transcription. No output is read while deriving a paint role.
function expected(file: string) {
  const entry = manifest.find(entry => entry.file === file)!, result = structuredClone(docs.find(c => c.id === entry.caseId).expected), facts = result.facts, roles: any[] = []
  const theme = file.includes('forest') ? 'forest' : file.includes('timeline-base') || file.includes('git-base') ? 'base' : 'redux-color', palette = theme === 'redux-color' ? undefined : sourceThemePalette(theme)
  if (entry.family === 'timeline') for (const [index, period] of facts.periods.entries()) {
    const color = palette!.scale[facts['authored-config']?.timeline?.disableMulticolor ? 0 : index % 7]!
    roles.push({ owner: period.period, kind: 'period', fill: color.hex, foreground: color.foreground })
    for (const event of period.events) roles.push({ owner: event, kind: 'event', fill: color.hex, foreground: color.foreground, brightness: 1.2 })
  }
  if (entry.family === 'treemap') {
    // Pinned source sorts siblings by descending summed source weight before
    // breadth-first section coloring. B40 precedes A30 in this literal case.
    const sections = facts.hierarchy.filter((row: any) => !row.parent).sort((a: any, b: any) => facts.values.find((v: any) => v.id === b.id).value - facts.values.find((v: any) => v.id === a.id).value)
    for (const row of facts.hierarchy) {
      const root = sections.find((section: any) => row.id === section.id || row.id.startsWith(section.id + '/')), color = palette!.scale[sections.indexOf(root)]!, section = sections.includes(row)
      roles.push({ owner: row.id, kind: section ? 'section' : 'leaf', fill: color.hex, foreground: color.foreground, fillOpacity: section ? .6 : .3, stroke: section ? color.peer : color.hex, strokeOpacity: section ? .4 : 1, strokeWidth: section ? 2 : 3 })
    }
  }
  if (entry.family === 'usecase') {
    const rotate = file.includes('rotate'), actors = facts['dialect-kinds'].filter((row: any) => row.kind === 'actor'), ordered = [...result.nodes.filter((node: any) => actors.some((actor: any) => actor.id === node.id)), ...result.nodes.filter((node: any) => !actors.some((actor: any) => actor.id === node.id))]
    for (const [index, node] of ordered.entries()) { const kind = actors.some((actor: any) => actor.id === node.id) ? 'actor' : 'usecase', color = rotate ? reduxUsecaseSourcePolicy.rotation[index % 4]! : reduxUsecaseSourcePolicy.role[kind]; roles.push({ owner: node.id, kind, fill: color.fill, stroke: color.stroke, foreground: reduxUsecaseSourcePolicy.foreground, strokeWidth: 2 }) }
    for (const [index, group] of (result.groups ?? []).entries()) { const color = reduxUsecaseSourcePolicy.rotation[index % 4]!; roles.push({ owner: group.id, kind: 'boundary', fill: color.fill, stroke: color.stroke, foreground: '#000000', strokeWidth: 1 }) }
    for (const row of facts['dialect-kinds']) if (['include', 'extend'].includes(row.kind)) roles.push({ owner: row.source + '->' + row.target, kind: row.kind, stroke: reduxUsecaseSourcePolicy.role[row.kind as 'include' | 'extend'] })
  }
  if (entry.family === 'gitgraph') for (const [index, branch] of facts.branches.entries()) {
    const color = palette!.git[index % 8]!
    roles.push({ owner: branch.id, kind: 'branch', fill: color.hex, foreground: color.foreground })
    for (const commit of facts.commits.filter((commit: any) => commit.branch === branch.id && commit.type === 'NORMAL' && !commit.mergedBranch)) roles.push({ owner: commit.id, kind: 'commit', fill: color.hex, stroke: color.hex })
  }
  facts['theme-paint'] = { theme, family: entry.family, quantizationTolerancePerChannel: 1, roles }
  return { entry, expected: result, source: sources.find(c => c.id === entry.caseId).source }
}
async function inspect(file: string, change?: string) {
  const input = expected(file), page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(readFileSync(new URL(file, directory), 'utf8'))
    if (change) await page.evaluate(change)
    const result = await inspectSvgDrawing(page, { family: input.entry.family, source: input.source, expected: input.expected })
    return result.checks.find(check => check.criterion === 'source-fact:theme-paint')
  } finally { await page.close() }
}
for (const file of ['timeline-base-mermaid.svg', 'timeline-forest-mermaid.svg', 'treemap-forest-mermaid.svg', 'usecase-redux-mermaid.svg', 'git-base-mermaid.svg']) test('source-owned concrete theme roles: ' + file, async () => {
  expect((await inspect(file))?.status).toBe('passed')
})
for (const file of ['timeline-base-pele.svg', 'treemap-forest-pele.svg', 'usecase-redux-pele.svg', 'git-base-pele.svg', 'usecase-rotate-mermaid.svg']) test('actual differing palette remains incorrect: ' + file, async () => {
  expect((await inspect(file))?.status).toBe('failed')
})
test('theme role captions cannot lend credit to wrong owned body paint or alpha', async () => {
  const wrongFill = `document.querySelector('path.node-bkg').style.fill='#00ff00'`
  expect((await inspect('timeline-base-mermaid.svg', wrongFill))?.status).toBe('failed')
  const wrongAlpha = `document.querySelectorAll('rect').forEach(e=>{if(e.getAttribute('fill-opacity')==='0.3')e.style.fillOpacity='1'})`
  expect((await inspect('treemap-forest-mermaid.svg', wrongAlpha))?.status).toBe('failed')
})
