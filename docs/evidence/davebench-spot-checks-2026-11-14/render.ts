// Render the spot-check sample through DaveBench's own call paths, keeping the outputs.
// Browser projects: browserHost + davebenchBrowserCall({ keepOutput: true }); CLI projects:
// davebenchCliCall / terminalCliCall with onOutput; Python terminal: TerminalCallWorker admit hook.
// TRIDENT_CHROMIUM_EXECUTABLE=... bun render.ts SAMPLE_JSON OUT_DIR PREPARED_DIR FROZEN_CATALOG MERMAID_CHECKOUT
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { browserHost, davebenchBrowserCall, davebenchCliCall } from '../../../unified/davebench.ts'
import { terminalCliCall, TerminalCallWorker } from '../../../unified/davebench-terminal.ts'
import { davebenchInputs } from '../../../unified/davebench-inputs.ts'
import { authoredDiagnosticSource, davebenchEmptyOutputRule, davebenchTerminalValidity, errorPatternSources, rawStatements } from '../../../unified/davebench-validity.ts'
import { latestBenchmarkRenderingArtifact, verifiedBenchmarkBinding, verifyBenchmarkArtifact } from '../../../unified/benchmark-versions.ts'
import { communityModuleOutputSupported } from '../../../unified/community.ts'
const [sampleFile, outDir, preparedDir, catalogFile, upstream] = process.argv.slice(2) as [string, string, string, string, string]
const sample: any[] = JSON.parse(readFileSync(sampleFile, 'utf8'))
const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'))
const browserPrepared: any[] = JSON.parse(readFileSync(join(preparedDir, 'community-browser-prepared.json'), 'utf8'))
const terminalPrepared: any[] = JSON.parse(readFileSync(join(preparedDir, 'community-prepared.json'), 'utf8'))
const inv = davebenchInputs(upstream), byId = new Map(inv.cases.map(c => [c.id, c.source]))
const slug = (text: string) => text.replace(/[^A-Za-z0-9._-]+/g, '_')
const results: any[] = []
const browser = await chromium.launch({ executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE, headless: true })
const save = (row: any, output: string | undefined, ext: string) => {
  const file = join(slug(row.project), slug(row.id) + '.' + ext)
  if (output !== undefined) { mkdirSync(join(outDir, slug(row.project)), { recursive: true }); writeFileSync(join(outDir, file), output) }
  results.push({ ...row, output: output === undefined ? null : file })
}
try {
  for (const project of [...new Set(sample.filter(s => s.format === 'svg').map(s => s.project))]) {
    const rows = sample.filter(s => s.format === 'svg' && s.project === project)
    const peer = structuredClone(browserPrepared.find(p => p.node.id === project)), node = catalog.nodes.find((n: any) => n.id === project)
    verifyBenchmarkArtifact(peer, node); peer.node = node
    const artifact = latestBenchmarkRenderingArtifact(peer)
    if (artifact !== peer.artifact) { peer.artifact = artifact; delete peer.browser }
    if (!peer.browser) {
      for (const row of rows) { let bytes: Buffer | undefined; const value = await davebenchCliCall(peer, byId.get(row.id)!, 'svg', 15000, b => { bytes = b }); save({ ...row, ...value }, bytes?.toString('utf8'), 'svg') }
      continue
    }
    const host = await browserHost(browser, peer, 'svg'), session = await host.open()
    try {
      for (const [index, row] of rows.entries()) {
        const source = byId.get(row.id)!, rule = davebenchEmptyOutputRule(source)
        const value: any = await session.page.evaluate(davebenchBrowserCall, { source, id: 'spot_' + index, format: 'svg', errorPatterns: errorPatternSources, errorSource: authoredDiagnosticSource(source), raw: rawStatements(source), ...(rule.drawsNothing === undefined ? {} : { drawsNothing: rule.drawsNothing }), keepOutput: true })
        const { output, ...rest } = value
        save({ ...row, ...rest }, output, 'svg')
      }
    } finally { await session.context.close(); await host.close() }
  }
  for (const project of [...new Set(sample.filter(s => s.format === 'terminal').map(s => s.project))]) {
    const rows = sample.filter(s => s.format === 'terminal' && s.project === project)
    const supplied = structuredClone(terminalPrepared.find(p => p.node.id === project)), node = catalog.nodes.find((n: any) => n.id === project)
    const peer = { ...supplied, node, artifact: verifiedBenchmarkBinding(supplied, node) }
    const a = peer.artifact, extra = a?.additionalCli?.find((cli: any) => cli.outputs.includes('terminal'))?.artifact
    const native = a?.kind === 'cli' ? a : !communityModuleOutputSupported(node, 'terminal') ? extra : undefined
    const directory = mkdtempSync(join(tmpdir(), 'davebench-spot-'))
    let captured: string | undefined
    const worker = native ? undefined : new TerminalCallWorker(peer, join(directory, 'operand.json'), undefined, (output, source) => { captured = typeof output === 'string' ? output : JSON.stringify(output); return davebenchTerminalValidity(output, source) })
    try {
      for (const [index, row] of rows.entries()) {
        captured = undefined
        const source = byId.get(row.id)!
        const value = native ? await terminalCliCall(native, source, directory, 15000, text => { captured = text }) : await worker!.call(source, 'spot:' + index, 15000)
        save({ ...row, ...value }, captured, 'txt')
      }
    } finally { await worker?.close(); rmSync(directory, { recursive: true, force: true }) }
  }
} finally { await browser.close() }
writeFileSync(join(outDir, 'renders.json'), JSON.stringify(results, null, 2) + '\n')
for (const r of results) console.log(r.format, r.project, r.id, r.outcome, r.invalid ?? r.error ?? '', r.output)
