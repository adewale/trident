import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import { drawingCases, type DrawingCase } from '../fidelity/drawing/corpus.ts'
import { inspectSvgDrawing } from '../fidelity/drawing/svg.ts'
import { captureDrawingPng } from '../fidelity/drawing/export-png.ts'
import { compareRasterWitness, resolveRasterObservation } from '../fidelity/drawing/png.ts'
import { DrawingWorker } from '../fidelity/drawing/worker.ts'
import { assessTextDrawing } from '../fidelity/drawing/terminal.ts'
import { browserHost } from './davebench.ts'
import { defaultChromium } from './benchmark-context.ts'
import { latestBenchmarkRenderingArtifact, assertCurrentBenchmarkArtifact } from './benchmark-versions.ts'
import { communityModuleOutputSupported } from './community.ts'
import { comparisonProjects } from './lineage.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { svgTextValidity, terminalTextValidity } from './davebench-validity.ts'

class InadmissibleOutput extends Error {}
/** Cases whose correct drawing is empty: there, an empty or zero-area output is
 * assessed by the empty-drawing observer instead of being refused admission. */
const expectsEmptyDrawing = (test: DrawingCase) => test.terminal.expected.graph?.nodes.length === 0 && test.terminal.expected.graph.edges.length === 0 && !test.terminal.expected.graph.groups?.length && !test.expected.groups?.length && !Object.keys(test.expected.facts ?? {}).length

const nativeCall = (artifact: any, source: string, format: string) => {
  const binding = artifact.outputBindings?.[format] ?? (format === 'terminal' ? { args: artifact.args ?? [], input: artifact.input ?? 'stdin' } : undefined)
  if (!binding) throw Error('No declared native ' + format + ' binding')
  const temporary = binding.args.some((arg: string) => arg.includes('{output}')) ? mkdtempSync(join(tmpdir(), 'trident-drawing-')) : undefined
  const destination = temporary ? join(temporary, 'output.' + format) : undefined
  try {
    const args = binding.args.map((arg: string) => (destination ? arg.replaceAll('{output}', destination) : arg))
    const result = spawnSync(artifact.executable, args, { input: source, timeout: 15000, maxBuffer: 32 * 1024 * 1024 })
    if (result.error || result.status !== 0) throw Error(result.error?.message ?? result.stderr?.toString().slice(0, 300))
    return destination ? readFileSync(destination) : result.stdout
  } finally {
    if (temporary) rmSync(temporary, { recursive: true, force: true })
  }
}
export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    console.log('drawing:correctness --prepared IMAGE_ARTIFACTS --terminal-prepared TERMINAL_ARTIFACTS --catalog FROZEN_CATALOG --out FRESH_DIR [--projects IDS] [--case ID_FRAGMENTS] [--formats svg,png|terminal]\nOne functional drawing assessment per case/output, with explicit gaps. No timing repeats.')
    return
  }
  assertBenchmarkExecutionAllowed()
  const opts = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) {
    if (!['--prepared', '--terminal-prepared', '--catalog', '--out', '--projects', '--case', '--formats'].includes(args[i]!) || !args[i + 1]) throw Error('Invalid drawing arguments')
    opts.set(args[i]!, args[i + 1]!)
  }
  for (const key of ['--prepared', '--terminal-prepared', '--catalog', '--out']) if (!opts.has(key)) throw Error('Missing ' + key)
  const read = (p: string) => JSON.parse(readFileSync(p, 'utf8')),
    out = resolve(opts.get('--out')!)
  if (existsSync(out)) throw Error('Use a fresh result directory')
  const catalog = read(opts.get('--catalog')!),
    projects = comparisonProjects(catalog, opts.get('--projects')?.split(',') ?? catalog.nodes.map((n: any) => n.id)).included
  const formats = opts.get('--formats')?.split(',') ?? ['svg', 'png', 'terminal']
  if (formats.some(f => !['svg', 'png', 'terminal'].includes(f))) throw Error('Unknown drawing format')
  if (formats.includes('svg') !== formats.includes('png')) throw Error('Select svg,png together, or terminal separately')
  const images = read(opts.get('--prepared')!),
    terminals = read(opts.get('--terminal-prepared')!)
  const cases = drawingCases().filter(
    c =>
      !opts.has('--case') ||
      opts
        .get('--case')!
        .split(',')
        .some(id => c.id.includes(id)),
  )
  if (!cases.length) throw Error('No drawing cases selected')
  mkdirSync(out, { recursive: true })
  const rows: any[] = [],
    blocked: any[] = []
  let raster: DrawingWorker | undefined,
    rasterError = 'Raster observer is unavailable'
  try {
    raster = new DrawingWorker(['python3', join(import.meta.dirname, '../fidelity/drawing/png_graph.py')])
  } catch (error) {
    rasterError = String(error)
  }
  const save = (state = 'running') =>
    writeFileSync(
      join(out, 'results.json'),
      JSON.stringify(
        {
          benchmark: 'Drawing Correctness',
          state,
          selection: opts.get('--case') ? 'functional subset' : 'full shared corpus',
          corpus: { cases: cases.length, ids: cases.map(c => c.id), seed: 'reviewed Terminal Drawing Facts, invalid controls excluded', regressions: 'corpus/drawing-regressions.json' },
          versionsFrozenAt: catalog.benchmarkVersionsCheckedAt,
          assessmentLimits: { nodes: 40, edges: 80, svgMs: 8000, invocationMs: 15000, rasterWorkerMs: 20000, terminalWorkerMs: 20000 },
          rows,
          blocked,
        },
        null,
        2,
      ),
    )
  const browser = await chromium.launch({ headless: true, executablePath: process.env.AM_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium) })
  let inspect = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  await inspect.route('**/*', route => route.abort())
  const bounded = async <T>(work: Promise<T>, label: string, ms = 8000): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>
    try {
      return await Promise.race([
        work,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(Error(label + ' deadline exceeded')), ms)
        }),
      ])
    } finally {
      clearTimeout(timer!)
    }
  }
  const complexityGap = (test: DrawingCase) => (test.expected.nodes?.length ?? 0) > 40 || (test.expected.edges?.length ?? 0) > 80
  try {
    for (const project of projects) {
      const node = catalog.nodes.find((n: any) => n.id === project),
        imagePeer = images.find((p: any) => p.node.id === project),
        terminalPeer = terminals.find((p: any) => p.node.id === project)
      if (formats.some(f => f === 'svg' || f === 'png') && imagePeer?.artifact) {
        let host: any, session: any
        try {
          assertCurrentBenchmarkArtifact(imagePeer, node)
          imagePeer.node = node
          const artifact = latestBenchmarkRenderingArtifact(imagePeer)
          if (!artifact) throw Error('No prepared rendering artifact')
          const native = artifact.kind === 'cli'
          if (!native && !imagePeer.browser) throw Error('No prepared SVG public interface')
          if (!native) {
            host = await browserHost(browser, imagePeer, 'png')
            session = await host.open()
          }
          for (const test of cases) {
            console.log(project, test.id, 'SVG/PNG')
            let svg: string, png: Buffer | undefined, assessment: any, witnessSvg: string | undefined
            try {
              svg = native
                ? nativeCall(artifact, test.source, 'svg').toString('utf8')
                : await bounded(
                    session.page.evaluate(async (c: any) => {
                      const v = await (globalThis as any).__fidelityCommunity.render(c.source, 'drawing_' + c.id.replace(/\W/g, '_'))
                      return typeof v === 'string' ? v : v.svg
                    }, test),
                    'Public SVG invocation',
                    15000,
                  )
              const admission = expectsEmptyDrawing(test) ? { valid: true as const } : svgTextValidity(svg, test.source)
              if (!admission.valid) throw new InadmissibleOutput(admission.reason)
              try {
                if (!complexityGap(test)) await inspect.setContent('<style>html,body{margin:0;padding:0;background:transparent}svg{max-width:none}</style>' + svg, { timeout: 8000 })
                assessment = complexityGap(test) ? { status: 'unknown', failed: [], unknown: ['Trident observer bound: more than 40 nodes or 80 edges'], sourceGaps: test.sourceGaps } : await bounded(inspectSvgDrawing(inspect, test), 'Trident SVG assessment')
              } catch (error) {
                assessment = { status: 'unknown', failed: [], unknown: ['Trident SVG observer: ' + String(error)], sourceGaps: test.sourceGaps }
                await inspect.close({ runBeforeUnload: false })
                inspect = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
                await inspect.route('**/*', route => route.abort())
              }
              rows.push({ project, version: artifact.version, format: 'svg', caseId: test.id, status: assessment.status, failed: assessment.failed, unknown: assessment.unknown, sourceGaps: assessment.sourceGaps })
            } catch (error) {
              if (error instanceof InadmissibleOutput) {
                // A zero-size or error-placeholder SVG is a known nonpass; the shared PNG path exports the same document.
                rows.push({ project, version: artifact.version, format: 'svg', caseId: test.id, status: 'invalid-format', reason: 'Inadmissible SVG output: ' + error.message })
                if (!native && !imagePeer.browser?.additionalOutputs?.includes('png')) {
                  rows.push({ project, version: artifact.version, format: 'png', caseId: test.id, status: 'invalid-format', reason: 'Shared PNG path received an inadmissible SVG: ' + error.message })
                  save()
                  continue
                }
                assessment = { status: 'unknown' }
                svg = ''
              } else {
              rows.push({ project, version: artifact.version, format: 'svg', caseId: test.id, status: 'renderer-failure', reason: String(error).slice(0, 400) })
              if (!native && !imagePeer.browser?.additionalOutputs?.includes('png')) {
                rows.push({ project, version: artifact.version, format: 'png', caseId: test.id, status: 'renderer-failure', reason: 'Shared PNG path failed at SVG render: ' + String(error).slice(0, 300) })
                save()
                continue
              }
              assessment = { status: 'unknown' }
              svg = ''
              }
            }
            try {
              if (native) png = nativeCall(artifact, test.source, 'png')
              else {
                const exported = await bounded<any>(session.page.evaluate(captureDrawingPng, { svg: svg!, source: test.source }), 'Public PNG invocation', 15000)
                png = Buffer.from(exported.bytes)
                witnessSvg = exported.witnessSvg
              }
              if (png.length < 8 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
                rows.push({ project, version: artifact.version, format: 'png', caseId: test.id, status: 'invalid-format', reason: 'PNG export returned bytes without the PNG signature' })
                save()
                continue
              }
              let result: any = { status: 'unknown', reason: 'No qualified raster assessment' }
              let rasterAssessment = assessment
              if (witnessSvg && !complexityGap(test)) {
                await inspect.setContent('<style>html,body{margin:0;padding:0;background:transparent}svg{max-width:none}</style><div style="width:' + png.readUInt32BE(16) + 'px;height:' + png.readUInt32BE(20) + 'px">' + witnessSvg + '</div>', { timeout: 8000 })
                rasterAssessment = await bounded(inspectSvgDrawing(inspect, test), 'Trident normalized PNG witness assessment')
              }
              if (['correct', 'incorrect'].includes(rasterAssessment.status)) {
                const witness = await inspect.locator('svg').first().screenshot({ type: 'png', omitBackground: true, timeout: 5000 })
                const equivalent = await inspect.evaluate(compareRasterWitness, { png: 'data:image/png;base64,' + png.toString('base64'), witness: 'data:image/png;base64,' + witness.toString('base64') })
                result = equivalent.status === 'correct' ? { status: rasterAssessment.status, reason: rasterAssessment.status === 'incorrect' ? 'PNG exactly preserves independently observed drawing failures: ' + rasterAssessment.failed.join(', ') : equivalent.reason } : equivalent
              }
              if (result.status === 'unknown' && !complexityGap(test) && test.family === 'flowchart' && !test.expected.groups?.length) {
                const layout = test.terminal.expected.contract?.facts.find(f => f.criterion === 'layout-order')?.expected
                const independent = raster ? await raster.call({ png: png.toString('base64'), family: test.family, expected: test.expected, layout, geometry: test.geometry }) : { status: 'unknown', reason: rasterError }
                result = resolveRasterObservation(result, independent, test.sourceGaps)
              }
              rows.push({ project, version: artifact.version, format: 'png', caseId: test.id, status: result.status, reason: result.reason })
            } catch (error) {
              const nativePng = native || imagePeer.browser?.additionalOutputs?.includes('png')
              rows.push({ project, version: artifact.version, format: 'png', caseId: test.id, status: png || !nativePng ? 'unknown' : 'renderer-failure', reason: (png ? 'Trident raster assessment: ' : !nativePng ? 'Trident shared PNG export: ' : '') + String(error).slice(0, 400) })
            }
            save()
            if (session)
              await session.page.evaluate(() => {
                ;(globalThis as any).__communityAfterCall?.()
                for (const e of document.querySelectorAll('body > div:not([data-community-host])')) e.remove()
              })
          }
        } catch (error) {
          blocked.push({ project, format: 'svg/png', reason: String(error).slice(0, 400) })
        } finally {
          await session?.context.close()
          await host?.close()
        }
      } else if (formats.some(f => f === 'svg' || f === 'png') && node.benchmark?.outputs.some((s: string) => s === 'svg' || s === 'png')) blocked.push({ project, format: node.benchmark.outputs.includes('svg') ? 'svg/png' : 'png', reason: imagePeer?.error ?? 'No prepared public artifact; setup remains isolated' })
      if (formats.includes('terminal') && terminalPeer?.artifact) {
        let worker: DrawingWorker | undefined
        try {
          assertCurrentBenchmarkArtifact(terminalPeer, node)
          terminalPeer.node = node
          const a = terminalPeer.artifact,
            extra = a.additionalCli?.find((c: any) => c.outputs.includes('terminal'))?.artifact
          const native = a.kind === 'cli' ? a : !communityModuleOutputSupported(node, 'terminal') ? extra : undefined
          const openWorker = async () => {
            const python = a.kind === 'python',
              executable = python ? a.executable : /bun/i.test(a.runtime ?? '') || /\.tsx?$/.test(a.module ?? '') ? process.execPath : 'node'
            worker = new DrawingWorker([executable, join(import.meta.dirname, '../fidelity/drawing/terminal-worker.' + (python ? 'py' : 'mjs'))])
            const ready = await worker.call({ type: 'init', peer: terminalPeer })
            if (!ready.ok) throw Error(ready.error)
          }
          if (!native) await openWorker()
          for (const test of cases) {
            if (!native && (!worker || worker.child.exitCode !== null)) await openWorker()
            const result = native
              ? (() => {
                  try {
                    return { ok: true, text: nativeCall(native, test.source, 'terminal').toString('utf8') }
                  } catch (e) {
                    return { ok: false, error: String(e) }
                  }
                })()
              : await worker!.call({ source: test.source }).catch(error => ({ ok: false, error: 'Worker transport: ' + String(error) }))
            if (!result.ok) {
              const stopped = /Worker has stopped|Worker exited|Worker transport/.test(result.error ?? '')
              rows.push({ project, version: native?.version ?? a.version, format: 'terminal', caseId: test.id, status: stopped ? 'unrun' : 'renderer-failure', reason: result.error })
              if (stopped || /Worker timed out/.test(result.error ?? '')) {
                await worker?.close()
                worker = undefined
              }
              save()
              continue
            }
            // An empty return, an error message or the source printed back is not a
            // drawing to assess: it is a known nonpass, not an observer gap.
            const admission = expectsEmptyDrawing(test) ? { valid: true as const } : terminalTextValidity(result.text, test.source)
            if (!admission.valid) {
              rows.push({ project, version: native?.version ?? a.version, format: 'terminal', caseId: test.id, status: 'invalid-format', reason: 'Inadmissible terminal output: ' + admission.reason })
              save()
              continue
            }
            const assessed: any = complexityGap(test) ? { status: 'unknown', reason: 'Trident observer bound: more than 40 nodes or 80 edges' } : assessTextDrawing(test, result.text)
            rows.push({ project, version: native?.version ?? a.version, format: 'terminal', caseId: test.id, status: assessed.status, reason: assessed.reason, failed: assessed.failedChecks, unknown: assessed.unknownChecks })
            save()
          }
        } catch (error) {
          blocked.push({ project, format: 'terminal', reason: String(error).slice(0, 400) })
          for (const pending of cases) if (!rows.some(r => r.project === project && r.format === 'terminal' && r.caseId === pending.id)) rows.push({ project, version: terminalPeer.artifact.version, format: 'terminal', caseId: pending.id, status: 'unrun', reason: 'Public worker unavailable' })
        } finally {
          await worker?.close()
        }
      }
      save()
    }
    save('complete')
  } finally {
    await raster?.close()
    await browser.close()
  }
  console.log(JSON.stringify({ cases: cases.length, assessedRows: rows.length, blocked }))
}
if (import.meta.main) await main()
