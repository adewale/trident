// Confirms the reference-rejected inputs with the pinned Mermaid oracle (mermaid.parse in jsdom)
// over every DaveBench input, and replays the reference's two other recorded failures
// (an external image) through DaveBench's browser path, once as measured and once with the
// image request answered locally.
// TRIDENT_CHROMIUM_EXECUTABLE=... bun reference-check.ts MERMAID_CHECKOUT PREPARED_DIR FROZEN_CATALOG OUT_JSON
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright'
import { assertMermaidOracle, mermaidVerdicts } from '../../../portable/mermaid-oracle.ts'
import { browserHost, davebenchBrowserCall } from '../../../unified/davebench.ts'
import { verifyBenchmarkArtifact } from '../../../unified/benchmark-versions.ts'
import { davebenchInputs } from '../../../unified/davebench-inputs.ts'
import { authoredDiagnosticSource, errorPatternSources, rawStatements } from '../../../unified/davebench-validity.ts'
const [upstream, preparedDir, catalogFile, out] = process.argv.slice(2) as [string, string, string, string]
const inventory = davebenchInputs(upstream), oracle = assertMermaidOracle()
const verdicts = await mermaidVerdicts(oracle, inventory.cases.map(input => input.source))
const rejected = verdicts.flatMap((verdict, position) => verdict.accepted ? [] : [{ position, id: inventory.cases[position]!.id, error: verdict.error }])
const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'))
const peer = JSON.parse(readFileSync(join(preparedDir, 'community-browser-prepared.json'), 'utf8')).find((candidate: any) => candidate.node.id === 'mermaid-js/mermaid')
const node = catalog.nodes.find((candidate: any) => candidate.id === peer.node.id)
verifyBenchmarkArtifact(peer, node); peer.node = node
const browser = await chromium.launch({ executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE, headless: true })
const replays: { position: number; id: string; harness: string; result: unknown }[] = []
try {
  const host = await browserHost(browser, peer, 'svg')
  const call = (page: Page, position: number) => { const source = inventory.cases[position]!.source; return page.evaluate(davebenchBrowserCall, { source, id: 'reference_' + position, format: 'svg', errorPatterns: errorPatternSources, errorSource: authoredDiagnosticSource(source), raw: rawStatements(source) }) }
  const measured = await host.open()
  for (const position of [11, 12, 41, 42, 665, 666]) replays.push({ position, id: inventory.cases[position]!.id, harness: 'as measured: requests outside the artifact origin are aborted', result: await call(measured.page, position) })
  await measured.context.close()
  const served = await host.open()
  await served.context.route('https://mermaid.js.org/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>' }))
  for (const position of [665, 666]) replays.push({ position, id: inventory.cases[position]!.id, harness: 'image request answered locally with a 10x10 SVG', result: await call(served.page, position) })
  await served.context.close(); await host.close()
} finally { await browser.close() }
writeFileSync(out, JSON.stringify({ commit: inventory.commit, oracle: { version: oracle.version, parser: oracle.parserVersion, jsdom: oracle.domVersion, integrity: oracle.integrity }, inputs: verdicts.length, accepted: verdicts.length - rejected.length, rejected, replays }, null, 2) + '\n')
console.log(JSON.stringify({ rejected, replays }, null, 2))
