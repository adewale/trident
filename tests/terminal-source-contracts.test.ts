import { createHash } from 'node:crypto'
import { expect, test } from 'bun:test'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { readTerminalCorpus, reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { assessTerminalDrawing, assessTerminalSourceRejection } from '../fidelity/terminal-assessment.ts'
import { terminalSourceReviews } from '../scripts/review-terminal-contracts.ts'

const reviewed = reviewedTerminalCases()
const source = (id: string) => reviewed.find(input => input.id === 'terminal:' + id)!
test('all120 immutable source inputs have complete explicit obligations, with no renderer-output facts or silently omitted families', () => {
  const cases = readTerminalCorpus().cases, reviews = terminalSourceReviews()
  expect(reviews).toHaveLength(120)
  expect(reviews.map(review => review.caseId)).toEqual(cases.map(input => input.id))
  expect(new Set(reviews.map(review => review.contract.family))).toHaveLength(21)
  expect(reviews.every(review => review.contract.facts.length && !review.contract.sourceUncertainties.length && review.sourceSha256 === cases.find(input => input.id === review.caseId)!.sourceSha256)).toBe(true)
  expect(reviews.filter(review => review.intent === 'invalid')).toHaveLength(4)
})
test('source ampersands inside labels do not become graph operators; real fan-in expands independently', () => {
  const literal = analyseTerminalSource('graph LR\nA[Track & Commit] & B(Author & Skill) --> E', 'flowchart')
  expect(analyseTerminalSource('flowchart\nA["*literal*"] --> B["`*formatted*`"]', 'flowchart').graph?.nodes.map(node => node.label)).toEqual(['*literal*', 'formatted'])
  expect(literal.graph?.nodes.map(node => node.label)).toEqual(['Track & Commit', 'Author & Skill', 'E'])
  expect(literal.graph?.edges).toEqual([{ source: 'A', target: 'E' }, { source: 'B', target: 'E' }])
  const compact = source('c18237e0a535bdb7')
  expect(compact.expected.graph?.nodes.map(node => node.id)).toEqual(['A', 'B'])
  expect(compact.expected.graph?.edges).toEqual([{ source: 'A', target: 'B' }])
  expect(source('dbc553f665d05c10').expected.graph?.nodes).toHaveLength(100)
})
test('cyclic and grouped sources retain literal direction advisories without inventing node ordering', () => {
  for (const input of [analyseTerminalSource('flowchart RL\nA-->B\nB-->A', 'flowchart'), analyseTerminalSource('flowchart TD\nsubgraph G\n direction LR\n A-->B\nend', 'flowchart')]) {
    expect(input.contract.facts.find(fact => fact.criterion === 'layout-direction')).toMatchObject({ required: false })
    expect(input.graph?.layout).toBeUndefined()
    expect(input.contract.presentation.some(item => typeof item === 'object' && item !== null && 'direction' in item)).toBe(false)
  }
})
test('every explicit rectangle has a primitive obligation and generic parameters do not become class identity', () => {
  const rectangle = analyseTerminalSource('flowchart LR\nA[Start] --> B[End]', 'flowchart')
  expect(rectangle.contract.facts.find(fact => fact.criterion === 'node-shapes')?.expected).toEqual([{ id: 'A', shape: 'rectangle' }, { id: 'B', shape: 'rectangle' }])
  const redefined = analyseTerminalSource('flowchart\nA[A]\nA((A))', 'flowchart')
  expect(redefined.contract.facts.find(fact => fact.criterion === 'node-shapes')?.expected).toEqual([{ id: 'A', shape: 'circle' }])
  const generic = source('c5455d2e2f5f8672').expected.contract!
  expect(generic.facts.find(fact => fact.criterion === 'class-bodies')?.expected).toContainEqual({ id: 'Box', declaration: 'Box~T~', genericParameters: 'T', members: ['+value T', '+map(fn) Box~T~'] })
  expect(generic.facts.find(fact => fact.criterion === 'class-relations')?.expected).toContainEqual({ source: 'Box', target: 'IntBox', marker: '<|--', leftCardinality: '', rightCardinality: '', caption: 'specializes' })
  const key = source('f78157ede4e2d1ab').expected.contract?.facts.find(fact => fact.criterion === 'entity-bodies')?.expected
  expect(key).toContainEqual({ id: 'BOOK', attributes: ['string *title', 'id *the_Primary_Key'], attributeFacts: [{ type: 'string', name: 'title', keys: ['PK'] }, { type: 'id', name: 'the_Primary_Key', keys: ['PK'] }] })
})
test('source contracts retain chart values, ER cardinality, packet bit ranges and hierarchy ownership', () => {
  expect(source('587429a5094fbb28').expected.contract?.facts.find(fact => fact.criterion === 'slice-values')?.expected).toContainEqual({ label: 'ML', value: 12.5 })
  expect(source('278dccc21dd27020').expected.contract?.facts.find(fact => fact.criterion === 'entity-relations')?.expected).toContainEqual({ source: 'ORDER', target: 'LINE-ITEM', sourceCardinality: '||', targetCardinality: '|{', identifying: true, caption: 'contains' })
  expect(source('ddef9c7af192e428').expected.contract?.facts[0]?.expected).toContainEqual({ firstBit: 32, lastBit: 63, label: 'Sequence Number' })
  expect(source('276c8474274911fa').expected.contract?.facts.find(fact => fact.criterion === 'gantt-tasks')?.expected).toMatchObject({ tasks: expect.arrayContaining([expect.objectContaining({ label: 'Ship', startDate: '2020-02-15', endDate: '2020-02-16', durationDays: 1, milestoneAt: '2020-02-15T12:00:00.000Z' })]) })
  expect(source('2598092a6e404821').expected.contract?.facts[0]?.expected).toContainEqual({ id: 'Leaf3', label: 'Leaf3', parent: 'Branch2', order: 5 })
})
test('empty valid source is not subject to a nonblank drawing requirement', () => {
  const empty = source('a5204531005bef25')
  expect(() => assessTerminalDrawing({ ...empty, source: empty.source + '\nA' }, '')).toThrow('stale')
  expect(empty.intent).toBe('valid')
  expect(empty.features).toContain('expected-empty-drawing')
  expect(assessTerminalDrawing(empty, '').status).toBe('correct')
  expect(assessTerminalDrawing(empty, 'unexpected node').status).toBe('incorrect')
  expect(assessTerminalDrawing(empty).status).toBe('unknown')
})
test('zero-node title drawings stay meaningful and unsupported group ink is not misclassified as an empty-source defect', () => {
  const text = '---\ntitle: Still a title\n---\nflowchart', analysis = analyseTerminalSource(text, 'flowchart'), base = source('a5204531005bef25'), item = { ...base, id: 'synthetic:source-control', source: text, sourceSha256: createHash('sha256').update(text).digest('hex'), expected: { status: 'independently-reviewed', contract: analysis.contract, graph: analysis.graph } }
  expect(assessTerminalDrawing(item, 'Still a title').status).toBe('correct')
  expect(assessTerminalDrawing(item, '').status).toBe('unknown')
  const groups = analyseTerminalSource('flowchart\nsubgraph G\nend', 'flowchart')
  expect(assessTerminalDrawing({ ...item, source: 'flowchart\nsubgraph G\nend', sourceSha256: createHash('sha256').update('flowchart\nsubgraph G\nend').digest('hex'), expected: { status: 'independently-reviewed', contract: groups.contract, graph: groups.graph } }, '┌───┐\n│ G │\n└───┘').status).toBe('unknown')
})
test('raw invalid UTF-8 stays unknown and binds actual bytes instead of replacement-decoded label evidence', () => {
  const text = 'flowchart\nA["�"]', analysis = analyseTerminalSource(text, 'flowchart'), base = source('a5204531005bef25'), item = { ...base, id: 'synthetic:source-control', source: text, sourceSha256: createHash('sha256').update(text).digest('hex'), expected: { status: 'independently-reviewed', contract: analysis.contract, graph: analysis.graph } }, drawing = '┌───┐\n│ � │\n└───┘'
  expect(assessTerminalDrawing(item, Buffer.from(drawing)).status).toBe('correct')
  const [prefix, suffix] = drawing.split('�'), bytes = Buffer.concat([Buffer.from(prefix!), Buffer.from([255]), Buffer.from(suffix!)]), verdict = assessTerminalDrawing(item, bytes)
  expect(verdict.status).toBe('unknown')
  expect('checks' in verdict && verdict.checks?.every(check => check.status === 'unknown' && check.detail.includes('UTF-8'))).toBe(true)
})
test('unimplemented family facts remain unknown even when every source label and number is echoed', () => {
  const er = source('278dccc21dd27020')
  const outcome = assessTerminalDrawing(er, 'CUSTOMER ORDER LINE-ITEM places contains || o{ |{ TB')
  expect(outcome.status).toBe('unknown')
  expect('checks' in outcome && outcome.checks?.every(check => check.status === 'unknown')).toBe(true)
})
test('actual pie bar values need owned weights, percentages and complete output, not a source echo', () => {
  const pie = source('6f0f134c3b965095'), valid = 'A  █████  33.3%\nB  █████  33.3%\nC  █████  33.3%'
  expect(assessTerminalDrawing(pie, valid).status).toBe('correct')
  expect(assessTerminalDrawing(pie, valid.replace('B  █████  33.3%', 'B  █  33.3%')).status).toBe('incorrect')
  expect(assessTerminalDrawing(pie, valid.replace('C  █████  33.3%', 'C  █████  55.5%')).status).toBe('incorrect')
  expect(assessTerminalDrawing(pie, valid + '\nAdditional fake chart').status).toBe('unknown')
})
test('pie proportions use an order-independent feasible scale and cannot pass uninformative equal bars', () => {
  const pie = source('587429a5094fbb28'), rows = [['Platform', 21, 42], ['Data', 13, 25], ['ML', 6, 12.5], ['Web', 4, 8], ['Mobile', 3, 6], ['QA', 2, 4], ['Docs', 1, 1.8], ['Misc', 1, .7]] as const
  const chart = (items: typeof rows | readonly (typeof rows[number])[]) => 'Cloud spend by team\n' + items.map(([label, bar, percent]) => label + '  ' + '█'.repeat(bar) + '  ' + percent.toFixed(1) + '%').join('\n')
  expect(assessTerminalDrawing(pie, chart(rows)).status).toBe('correct')
  expect(assessTerminalDrawing(pie, chart([...rows].reverse())).status).toBe('correct')
  expect(assessTerminalDrawing(pie, 'Cloud spend by team\n' + rows.map(([label, , percent]) => label + '  █  ' + percent.toFixed(1) + '%').join('\n')).status).not.toBe('correct')
  expect(assessTerminalDrawing(pie, chart(rows).replace('Data  █████████████', 'Data  ██████████████████████████')).status).toBe('incorrect')
})
test('journey and timeline summaries retain section, actor, score, event and chronology ownership without orphan ink', () => {
  const journey = source('a60c7e7b3b930353'), drawing = '私の一日の流れ\n[出勤前の準備]\n●●●●● お茶を入れる\nby 私\n●●●○○ メールを確認する\nby 私\n[帰宅]\n●●●●○ 夕食を作る\nby 私, 家族'
  expect(assessTerminalDrawing(journey, drawing).status).toBe('correct')
  expect(assessTerminalDrawing(journey, drawing.replace('●●●○○', '●●●●○')).status).toBe('incorrect')
  expect(assessTerminalDrawing(journey, drawing.replace('by 私, 家族', 'by 家族')).status).toBe('incorrect')
  expect(assessTerminalDrawing(journey, drawing + '\nby extra').status).not.toBe('correct')
  expect(assessTerminalDrawing(journey, drawing + '\n[Extra section]').status).not.toBe('correct')
  const timeline = source('da9198e1adbc1c14'), events = 'Project Roadmap\n[Phase 1]\n○ 2023\n│ ├─ Planning\n│ └─ Requirements\n○ 2024\n│ ├─ Development\n│ └─ Testing\n[Phase 2]\n○ 2025\n│ ├─ Launch\n│ └─ Support'
  expect(assessTerminalDrawing(timeline, events).status).toBe('correct')
  expect(assessTerminalDrawing(timeline, events.replace('2024', '2026')).status).toBe('incorrect')
  expect(assessTerminalDrawing(timeline, events.replace('Planning', 'Testing').replace('│ └─ Testing', '│ └─ Planning')).status).toBe('incorrect')
  expect(assessTerminalDrawing(timeline, '│ └─ Orphan\n' + events).status).not.toBe('correct')
  expect(assessTerminalDrawing(timeline, events + '\n[Extra section]').status).not.toBe('correct')
})
test('invalid source rejection is separate and requires typed public evidence', () => {
  const invalid = source('486d9d241d7bf98f')
  expect(assessTerminalDrawing(invalid, 'renderer error').status).toBe('unknown')
  expect(assessTerminalSourceRejection(invalid).status).toBe('unknown')
  const typed = { project: 'fixture/terminal', caseId: invalid.id, sourceSha256: invalid.sourceSha256, publicBoundary: 'synthetic public typed parser control', detail: 'UnknownDiagramError', observerSha256: 'a'.repeat(64), kind: 'unknown-family' as const }
  expect(assessTerminalSourceRejection(invalid, typed, 'fixture/terminal').status).toBe('correct')
  expect(assessTerminalSourceRejection(invalid, { ...typed, kind: 'accepted' }, 'fixture/terminal').status).toBe('incorrect')
  expect(() => assessTerminalSourceRejection(invalid, { ...typed, sourceSha256: '0'.repeat(64) }, 'fixture/terminal')).toThrow('stale')
})

test('canonical drawing and rejection verdicts require the exact independently audited source contract', () => {
  const empty = source('a5204531005bef25'), changed = structuredClone(empty)
  changed.expected.contract!.facts.find(fact => fact.criterion === 'nodes')!.expected = [{ id: 'invented', label: 'invented' }]
  expect(assessTerminalDrawing(changed, '').status).toBe('unknown')
  expect(assessTerminalDrawing({ ...empty, expected: { ...empty.expected, graph: { nodes: [{ id: 'injected', label: 'injected' }], edges: [] } } }, '').status).toBe('unknown')
  const invalid = structuredClone(source('321aee6efed4a803'))
  invalid.expected.contract!.facts[0]!.expected = 'invented answer'
  expect(assessTerminalSourceRejection(invalid).status).toBe('unknown')
  const text = empty.source + '\nA', analysis = analyseTerminalSource(text, 'flowchart')
  expect(assessTerminalDrawing({ ...empty, source: text, sourceSha256: createHash('sha256').update(text).digest('hex'), expected: { status: 'independently-reviewed', contract: analysis.contract, graph: analysis.graph } }, '').status).toBe('unknown')
})
