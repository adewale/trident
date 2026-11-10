import { inspectFidelityPaint } from '../fidelity/paint.ts'
import { labelPaintCriteria, observeSvgLabels } from '../fidelity/drawing/svg-label-observer.ts'
import { expect, test } from 'bun:test'
import { assessLabels, assessTerminalLabels, assessSvgLabels, expectedLabels, labelFound, leakedSyntax, svgText, terminalText } from '../fidelity/drawing/labels.ts'
import { chromium } from 'playwright'
import { defaultChromium } from '../unified/benchmark-context.ts'

const flow: any = {
  id: 'fixture', family: 'flowchart', source: 'flowchart TD\nMermaid[Mermaid.js] -->|derivative| Beautiful[Beautiful Mermaid]\n', sourceGaps: [], geometry: [],
  expected: { nodes: [{ id: 'Mermaid', label: 'Mermaid.js' }, { id: 'Beautiful', label: 'Beautiful Mermaid' }], edges: [{ source: 'Mermaid', target: 'Beautiful', label: 'derivative' }], facts: { 'authored-config': { title: 'not a label' } } },
  terminal: { expected: { graph: { nodes: [{}, {}], edges: [{}] } } },
}

test('expected labels come from reviewed nodes, edges and named facts, not configuration', () => {
  expect(expectedLabels(flow)).toEqual(['Mermaid.js', 'Beautiful Mermaid', 'derivative'])
  const pie: any = { ...flow, expected: { facts: { title: 'Pets', slices: [{ label: 'Dogs', value: 0.8 }, { label: 'Cats', value: 0.2 }], 'show-data': false } } }
  expect(expectedLabels(pie)).toEqual(['Pets', 'Dogs', 'Cats'])
  const markdown: any = { ...flow, expected: { nodes: [{ id: 'a', label: '**Bold** and `code`<br>next' }] } }
  expect(expectedLabels(markdown)).toEqual(['Bold and code next'])
})

test('reviewed group labels are obligations and unreviewed families or source gaps stay unknown', () => {
  const grouped = { ...flow, expected: { ...flow.expected, groups: [{ id: 'backend', label: 'Backend' }] } }
  expect(assessLabels(grouped, 'terminal', 'Mermaid.js Beautiful Mermaid derivative')).toMatchObject({ status: 'incorrect', missing: ['Backend'] })
  expect(assessLabels(grouped, 'terminal', 'Mermaid.js Beautiful Mermaid derivative Backend').status).toBe('correct')
  expect(assessLabels({ ...flow, family: 'future-family' }, 'terminal', '').status).toBe('unknown')
  expect(assessLabels({ ...flow, sourceGaps: ['Unreviewed source'] }, 'terminal', 'Mermaid.js Beautiful Mermaid derivative').status).toBe('unknown')
  expect(assessLabels({ ...flow, expected: { ...flow.expected, labels: ['Reviewed description'] } }, 'terminal', 'Mermaid.js Beautiful Mermaid derivative')).toMatchObject({ status: 'incorrect', missing: ['Reviewed description'] })
})

test('SVG text includes HTML labels and excludes styles and accessibility metadata', () => {
  const svg = '<svg><title>Mermaid.js</title><style>.label{}</style><g><foreignObject><div>Beautiful<br/>Mermaid</div></foreignObject><text><tspan>derivative</tspan></text></g></svg>'
  expect(svgText(svg).replace(/\s+/g, ' ').trim()).toBe('Beautiful Mermaid derivative')
  expect(assessLabels(flow, 'svg', svgText(svg))).toMatchObject({ status: 'incorrect', missing: ['Mermaid.js'] })
})

test('terminal labels wrapped inside boxes are still found', () => {
  const drawing = '┌────────────┐      ┌───────────┐\n│ Mermaid.js ├─────►│ Beautiful │\n└────────────┘ deri │ Mermaid   │\n              vative└───────────┘'
  expect(labelFound('Beautiful Mermaid', terminalText(drawing))).toBe(true)
  expect(assessLabels(flow, 'terminal', terminalText(drawing + '\nderivative'))).toMatchObject({ status: 'correct' })
})

test('overlapping terminal frames exhaust an observation budget instead of expanding in the controller', () => {
  for (const size of [80, 160]) {
    const drawing = Array(size).fill('+'.repeat(size)).join('\n')
    expect(assessTerminalLabels(flow, drawing)).toMatchObject({ status: 'unknown', reason: 'Terminal rectangle observation budget exceeded' })
  }
  expect(assessTerminalLabels(flow, 'Mermaid.js Beautiful Mermaid derivative').status).toBe('correct')
})

test('sparse wide terminal frames are observed within the unchanged work budget', () => {
  const width = 240, height = 160
  const drawing = ['┌' + '─'.repeat(width) + '┐', '│Mermaid.js Beautiful Mermaid derivative'.padEnd(width + 1) + '│', ...Array(height - 3).fill('│' + ' '.repeat(width) + '│'), '└' + '─'.repeat(width) + '┘'].join('\n')
  expect(assessTerminalLabels(flow, drawing).status).toBe('correct')
  expect(assessTerminalLabels(flow, drawing.replace('Beautiful Mermaid', 'Beautiful Mermaix'))).toMatchObject({ status: 'incorrect', missing: ['Beautiful Mermaid'] })
})

test('raw source syntax in the output is a failure even when labels are present', () => {
  const echoed = 'flowchart TD Mermaid[Mermaid.js] -->|derivative| Beautiful[Beautiful Mermaid]'
  expect(leakedSyntax(flow, echoed)).toEqual(['flowchart TD', 'Mermaid[Mermaid.js', 'Beautiful[Beautiful Mermaid', '|derivative|'])
  expect(assessLabels(flow, 'svg', echoed).status).toBe('incorrect')
  // ASCII art draws edge labels beside '|' line characters.
  expect(leakedSyntax(flow, '|derivative|', 'terminal')).toEqual([])
  // Very short identifiers are not checked: OCR and drawings produce such sequences by chance.
  expect(leakedSyntax({ ...flow, source: 'C4Context\nSystem(s, "S")', expected: { nodes: [{ id: 's', label: 'S' }] } }, 's[S')).toEqual([])
})

test('label matching is exact apart from whitespace and wrapping', () => {
  expect(labelFound('Prototype', 'Proto type')).toBe(true)
  expect(labelFound('Prototype', 'prototype')).toBe(false)
  expect(labelFound('Prototype', 'Prototvpe')).toBe(false)
  expect(labelFound('Do not approve', 'approve unrelated Do unrelated not')).toBe(false)
})

test('SVG label verdicts require visible, unclipped text rather than hidden DOM contents', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  const context = await browser.newContext({ javaScriptEnabled: false }), page = await context.newPage()
  try {
    const example: any = { ...flow, source: 'flowchart LR\nA[Alpha] --> B[Beta]', expected: { nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }] } }
    const text = '<text x="10" y="30">Alpha</text><text x="100" y="30">Beta</text>'
    const unsupportedFilter = '<defs><filter id="erase"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0"/></filter></defs><g filter="url(#erase)">' + text + '</g>'
    const gradient = '<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" x2="300"><stop stop-color="black"/><stop offset="1" stop-color="red"/></linearGradient></defs>'
    const backdrop = '<rect width="300" height="100" fill="url(#g)"/>'
    const gradientLabels = gradient + backdrop + '<g fill="url(#g)">' + text + '</g>'
    const gradientBackdrop = gradient.replace('<stop offset="1"', '<stop offset="0.8" stop-color="black"/><stop offset="1"') + backdrop + text
    for (const [body, expected] of [[text, 'correct'], [text + '<text display="none">flowchart LR</text>', 'unknown'], [text + '<text x="10" y="60">flowchart LR</text>', 'incorrect'], ['<g display="none">' + text + '</g>', 'incorrect'], ['<g opacity="0">' + text + '</g>', 'incorrect'], [text + '<rect width="300" height="100" fill="white"/>', 'incorrect'], [unsupportedFilter, 'unknown'], [gradientLabels, 'unknown'], [gradientBackdrop, 'unknown']] as const) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">' + body + '</svg>'
      await page.setContent(svg)
      const full = await page.evaluate(inspectFidelityPaint, { family: example.family, expected: { labels: expectedLabels(example) } })
      const narrow = await observeSvgLabels(page, example.family, expectedLabels(example))
      expect(narrow).toEqual(Object.fromEntries(labelPaintCriteria.map(criterion => [criterion, full.checks.find(check => check.criterion === criterion)?.status ?? 'unavailable'])))
      expect((await assessSvgLabels(example, page, svg)).status).toBe(expected)
    }
  } finally { await browser.close() }
})

test('SVG emergency wrapping preserves letters only at observed line boundaries', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  const context = await browser.newContext({ javaScriptEnabled: false }), page = await context.newPage()
  try {
    const example: any = { ...flow, source: 'flowchart LR\nA[Small rectangle]', expected: { nodes: [{ id: 'A', label: 'Small rectangle' }] } }
    for (const [middle, last, attributes, expected] of [
      ['rectangl', 'e', '', 'correct'],
      ['rectangl-', 'e', '', 'incorrect'],
      ['rectang', 'e', '', 'incorrect'],
      ['rect angl', 'e', '', 'incorrect'],
      ['rectangl', 'e', 'opacity="0"', 'incorrect'],
      ['rectangl', 'e', 'transform="translate(400 0)"', 'nonpass'],
    ] as const) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><text x="20" y="25" ${attributes}><tspan x="20">Small</tspan><tspan x="20" dy="20">${middle}</tspan><tspan x="20" dy="20">${last}</tspan></text></svg>`
      await page.setContent(svg)
      const status = (await assessSvgLabels(example, page, svg)).status
      // Font availability determines whether overflowing ink is measurable or
      // unqualified. Neither outcome may earn a label pass on any platform.
      if (expected === 'nonpass') expect(['incorrect', 'unknown']).toContain(status)
      else expect(status, JSON.stringify({ middle, last, attributes })).toBe(expected)
    }
  } finally { await browser.close() }
})

test('unresolved raw SVG syntax cannot earn credit through fragments or hidden exact matches', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  const context = await browser.newContext({ javaScriptEnabled: false }), page = await context.newPage()
  try {
    const example: any = { ...flow, source: 'flowchart LR\nA[Alpha] --> B[Beta]', expected: { nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }] } }
    const labels = '<text x="10" y="25">Alpha</text><text x="150" y="25">Beta</text>'
    for (const leak of [
      '<text x="10" y="65">flowchart</text><text x="80" y="65">LR</text>',
      '<text x="10" y="65">prefix flowchart LR suffix</text><text display="none">flowchart LR</text>',
      '<text x="10" y="65">prefix flowchart LR suffix</text><defs><text>flowchart LR</text></defs>',
      '<text x="10" y="65">flowchart</text><text x="300" y="90">elsewhere</text><text x="80" y="65">LR</text><text display="none">flowchart LR</text>',
      '<marker id="m" markerUnits="userSpaceOnUse" markerWidth="200" markerHeight="30"><text x="0" y="20">flowchart LR</text></marker><line x1="10" y1="45" x2="11" y2="45" stroke="black" marker-start="url(#m)"/>',
      '<defs><text id="src" x="10" y="65">flowchart LR</text></defs><use href="#src"/><text display="none">flowchart LR</text>',
      '<clipPath id="c"><text x="10" y="65">flowchart LR</text></clipPath><rect y="40" width="300" height="60" clip-path="url(#c)"/>',
      '<mask id="m" maskUnits="userSpaceOnUse"><text x="10" y="65" fill="white">flowchart LR</text></mask><rect y="40" width="300" height="60" mask="url(#m)"/>',
    ]) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">' + labels + leak + '</svg>'
      await page.setContent(svg)
      expect((await assessSvgLabels(example, page, svg)).status).toBe('unknown')
    }
  } finally { await browser.close() }
})

test('an empty diagram passes only without text; a case without labels is judged on raw syntax alone', () => {
  const empty: any = { ...flow, source: 'flowchart\n', expected: { nodes: [], edges: [], facts: {} }, terminal: { expected: { graph: { nodes: [], edges: [] } } } }
  expect(assessLabels(empty, 'svg', '   ').status).toBe('correct')
  expect(assessLabels(empty, 'svg', 'Syntax error').status).toBe('incorrect')
  const unlabeled: any = { ...flow, source: 'xychart-beta\n bar [1]', expected: { facts: { series: [{ kind: 'bar', values: [1] }] } }, terminal: { expected: {} } }
  expect(assessLabels(unlabeled, 'svg', 'a horizontal bar of length 1').status).toBe('correct')
  expect(assessLabels(unlabeled, 'terminal', 'bar [1]').status).toBe('incorrect')
  expect(assessLabels(unlabeled, 'svg', 'xychart-beta').status).toBe('incorrect')
})

test('a label written with an escape sequence is found in its visible forms', () => {
  expect(labelFound('\u001b[31mX', 'A [31mX B')).toBe(true)
  expect(labelFound('\u001b[31mX', 'A X B')).toBe(true)
  expect(labelFound('\u001b[31mX', 'A \u001b[31mX B')).toBe(true)
  expect(labelFound('\u001b[31mX', 'A Y B')).toBe(false)
})

test('the static primitive label path preserves global unresolved-paint and visibility guards', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  const page = await browser.newPage({ javaScriptEnabled: false })
  try {
    const label = '<text x="20" y="40" fill="black">Alpha</text>'
    const fixtures = [
      label,
      '<rect width="300" height="100" fill="white"/>' + label,
      label + '<rect width="300" height="100" fill="white"/>',
      '<g opacity="0">' + label + '</g>',
      label + '<defs><pattern id="p" width="3" height="3" patternUnits="userSpaceOnUse"><line x2="3" y2="3" stroke="black"/></pattern></defs><rect x="200" y="60" width="20" height="20" fill="url(#p)"/>',
      label + '<defs><filter id="f"><feColorMatrix type="saturate" values="0"/></filter></defs><line x1="250" x2="250" y1="80" y2="80" filter="url(#f)"/>',
      '<path d="M0 0 L100 0 L100 50Z" fill="black"/>',
    ]
    for (const body of fixtures) {
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">' + body + '</svg>')
      const full = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected: { labels: ['Alpha'] } })
      expect(await observeSvgLabels(page, 'flowchart', ['Alpha'])).toEqual(Object.fromEntries(labelPaintCriteria.map(key => [key, full.checks.find(c => c.criterion === key)?.status ?? 'unavailable'])))
    }
  } finally { await browser.close() }
})

test('sanitized SVG control labels use complete visible paint evidence and keep wrong or hidden labels failing', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  const page = await browser.newPage()
  try {
    const example: any = { ...flow, source: 'flowchart LR\nA["\u001b[31mAlpha"] --> B[Beta]', expected: { nodes: [{ id: 'A', label: '\u001b[31mAlpha' }, { id: 'B', label: 'Beta' }] } }
    for (const [body, expected] of [
      ['<text x="10" y="30">Alpha</text>', 'correct'],
      ['<text x="10" y="30">[31mAlpha</text>', 'correct'],
      ['<text x="10" y="30">?[31mAlpha</text>', 'correct'],
      ['<text x="10" y="30">Wrong</text>', 'incorrect'],
      ['<text x="10" y="30" opacity="0">Alpha</text>', 'incorrect'],
      ['<text x="10" y="30">Alpha</text><rect width="150" height="100" fill="white"/>', 'incorrect'],
      // Platforms with qualified glyph bounds can prove this failure; others
      // withhold it. Neither may give an off-canvas label correctness credit.
      ['<text x="-500" y="30">Alpha</text>', 'nonpass'],
    ] as const) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100">' + body + '<text x="200" y="30">Beta</text></svg>'
      await page.setContent(svg)
      const status = (await assessSvgLabels(example, page, svg)).status
      if (expected === 'nonpass') expect(status, body).not.toBe('correct')
      else expect(status, body).toBe(expected)
    }
    const missingOther = '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"><text x="10" y="30">Alpha</text></svg>'
    await page.setContent(missingOther)
    expect((await assessSvgLabels(example, page, missingOther)).status).toBe('incorrect')
  } finally { await page.close(); await browser.close() }
})
