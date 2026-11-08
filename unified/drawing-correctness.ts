import { campaignPlan, assertCampaignCoverage, planDigest } from './campaign-plan.ts'
import { byteDigest } from '../portable/artifacts.ts'
import { svgLabelProfile } from '../fidelity/drawing/svg-label-observer.ts'
import { atomicWrite, checkpointDue, reserveResultDirectory } from './result-storage.ts'
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { watchMemory } from './process-memory.ts'
import { pythonRenderer } from './python-renderer.ts'
import { killCommunityProcess, spawnCommunityProcess } from './community-process.ts'
import { chromium } from 'playwright'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { DrawingWorker } from '../fidelity/drawing/worker.ts'
import { assessTerminalLabels, assessSvgLabels, expectsEmptyDrawing, terminalLabelWorkBudget, compileLabelPlan, labelPolicy } from '../fidelity/drawing/labels.ts'
import { browserHost } from './davebench.ts'
import { defaultChromium } from './benchmark-context.ts'
import { latestBenchmarkRenderingArtifact, plannedBenchmarkVersion, verifiedBenchmarkBinding } from './benchmark-versions.ts'
import { qualifyOutputFormat } from './qualification.ts'
import { communityDeclaresOutput, communityModuleOutputSupported } from './community.ts'
import { comparisonProjects } from './lineage.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { svgTextValidity, terminalTextValidity } from './davebench-validity.ts'

class InadmissibleOutput extends Error {}
class InvocationTimeout extends Error {}

const nativeCall = async (artifact: any, source: string, format: string) => {
  const binding = artifact.outputBindings?.[format] ?? (format === 'terminal' ? { args: artifact.args ?? [], input: artifact.input ?? 'stdin' } : undefined)
  if (!binding) throw Error('No declared native ' + format + ' binding')
  const temporary = binding.args.some((arg: string) => arg.includes('{output}')) ? mkdtempSync(join(tmpdir(), 'trident-drawing-')) : undefined
  const destination = temporary ? join(temporary, 'output.' + format) : undefined
  try {
    const args = binding.args.map((arg: string) => (destination ? arg.replaceAll('{output}', destination) : arg))
    const result = await new Promise<{ stdout: Buffer; stderr: string; status: number | null; error?: string }>(done => {
      const child = spawnCommunityProcess(artifact.executable, args, { detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] })
        const out: Buffer[] = []
      let stderr = '', size = 0, error: string | undefined
      child.stdout!.on('data', (chunk: Buffer) => { size += chunk.length; if (size <= 32 * 1024 * 1024) out.push(chunk) })
      child.stderr!.on('data', chunk => { if (stderr.length < 4096) stderr += String(chunk) })
      const timer = setTimeout(() => { error = 'spawn ' + artifact.executable + ' ETIMEDOUT'; killCommunityProcess(child, 'SIGKILL') }, 15000)
      const unwatch = watchMemory(child.pid, () => { error = 'memory limit'; killCommunityProcess(child, 'SIGKILL') })
      child.once('error', thrown => { error ??= thrown.message })
      child.once('close', status => { clearTimeout(timer); unwatch(); done({ stdout: Buffer.concat(out), stderr, status, error }) })
      child.stdin!.on('error', () => {})
      child.stdin!.end(source)
    })
    if (result.error || result.status !== 0) throw Error(result.error ?? result.stderr.slice(0, 300))
    return destination ? readFileSync(destination) : result.stdout
  } finally {
    if (temporary) rmSync(temporary, { recursive: true, force: true })
  }
}
export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    console.log('drawing:correctness --prepared IMAGE_ARTIFACTS --terminal-prepared TERMINAL_ARTIFACTS --catalog FROZEN_CATALOG --out FRESH_DIR [--projects IDS] [--case ID_FRAGMENTS] [--formats svg,terminal]\nLabel assessment of SVG and terminal outputs, one per case/output. PNG is not part of Drawing Correctness. No timing repeats.')
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
  const formats = opts.get('--formats')?.split(',') ?? ['svg', 'terminal']
  if (formats.includes('png')) throw Error('PNG is not part of Drawing Correctness: OCR cannot read diagram labels reliably. Select svg and/or terminal')
  if (formats.some(f => !['svg', 'terminal'].includes(f))) throw Error('Unknown drawing format')
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
  reserveResultDirectory(out)
  const labelPlans = new Map(cases.map(test => [test.id, compileLabelPlan(test)]))
  const contractSha256 = planDigest(cases.map(test => ({ id: test.id, source: test.source, expected: test.expected, sourceGaps: test.sourceGaps })))
  const common = { policy: labelPolicy, labels: byteDigest(join(import.meta.dirname, '../fidelity/drawing/labels.ts')) }
  const assessmentProfiles = Object.fromEntries(formats.map(format => [format, planDigest({ common, ...(format === 'svg' ? { profile: svgLabelProfile, paint: byteDigest(join(import.meta.dirname, '../fidelity/paint.ts')), observer: byteDigest(join(import.meta.dirname, '../fidelity/drawing/svg-label-observer.ts')), glyphWitness: byteDigest(join(import.meta.dirname, '../fidelity/drawing/svg-glyph-witness.ts')), empty: byteDigest(join(import.meta.dirname, '../fidelity/drawing/empty.ts')) } : { display: byteDigest(join(import.meta.dirname, '../fidelity/terminal-display.ts')), rectangles: byteDigest(join(import.meta.dirname, '../fidelity/terminal-rectangles.ts')), budget: terminalLabelWorkBudget }) })]))
  const lanes = projects.flatMap(project => {
    const node = catalog.nodes.find((node: any) => node.id === project)!
    return formats.filter(format => communityDeclaresOutput(node, format)).map(format => {
      const peer = (format === 'svg' ? images : terminals).find((peer: any) => peer.node.id === project)
      let artifact = peer?.artifact
      if (format === 'svg' && peer) { try { artifact = latestBenchmarkRenderingArtifact(peer) } catch { artifact = undefined } }
      if (format === 'terminal' && artifact && !communityModuleOutputSupported(node, 'terminal')) artifact = artifact.kind === 'cli' ? artifact : artifact.additionalCli?.find((cli: any) => cli.outputs.includes('terminal'))?.artifact ?? artifact
      return { project, version: plannedBenchmarkVersion(node, artifact), format }
    })
  })
  const plan = campaignPlan(lanes, cases.map(test => test.id), 1, { contractSha256, assessmentProfiles }, opts.has('--projects') || opts.has('--case') || opts.has('--formats') ? 'subset' : 'full')
  const due = checkpointDue()
  const rows: any[] = [],
    blocked: any[] = []
  const pythonRuntimes = new Map<string, ReturnType<typeof pythonRenderer>>()
  // The collection's own times: published dates come from these, never from a later merge.
  const startedAt = new Date().toISOString()
  const save = (state = 'running', force = false) => {
    if (state === 'complete') {
      for (const lane of plan.lanes) if (blocked.some(block => block.project === lane.project && block.format === lane.format)) {
        const own = rows.filter(row => row.project === lane.project && row.format === lane.format)
        // A lane blocked before invoking any case remains a block, rather than 127
        // invented observations. A stopped partial lane explicitly accounts for the rest.
        if (own.length) for (const test of cases) if (!own.some(row => row.caseId === test.id)) rows.push({ ...lane, caseId: test.id, status: 'unrun', reason: 'Public worker unavailable' })
      }
      assertCampaignCoverage(plan, rows, blocked, 'drawing')
    }
    if (!due(force || state === 'complete')) return
    atomicWrite(
      join(out, 'results.json'),
      JSON.stringify(
        {
          benchmark: 'Drawing Correctness',
          state, plan, assessmentPolicy: labelPolicy, assessmentProfiles,
          runtimeBindings: [...pythonRuntimes].map(([project, runtime]) => ({ project, format: 'terminal', binding: runtime.identity })),
          startedAt,
          updatedAt: new Date().toISOString(),
          selection: opts.get('--case') ? 'functional subset' : 'full shared corpus',
          corpus: { cases: cases.length, ids: cases.map(c => c.id), contractSha256, seed: 'reviewed Terminal Drawing Facts, invalid controls excluded', regressions: 'corpus/drawing-regressions.json' },
          versionsFrozenAt: catalog.benchmarkVersionsCheckedAt,
          method: 'Label assessment: SVG labels must pass browser visibility, canvas and clipping checks, or a bounded pixel comparison proving the complete original glyphs remain visible against their actual backdrop. Unsupported observations remain unassessed. Terminal labels retain their reading order, with wrapping joined within observed frames. Raw Mermaid syntax is rejected. Edges, arrow direction, layout and styling are not scored. PNG is not assessed.',
          assessmentLimits: { invocationMs: 15000, svgObserverMs: 8000, terminalWorkerMs: 20000, terminalRectangleWork: terminalLabelWorkBudget, compileLabelPlan, labelPolicy },
          rows,
          blocked,
        },
        null,
        2,
      ),
    )
  }
  save('running', true)
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium) })
  const assessmentContext = await browser.newContext({ javaScriptEnabled: false })
  await assessmentContext.route('**/*', route => route.abort())
  const bounded = async <T>(work: Promise<T>, label: string, ms = 8000): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>
    try {
      return await Promise.race([
        work,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new InvocationTimeout(label + ' deadline exceeded')), ms)
        }),
      ])
    } finally {
      clearTimeout(timer!)
    }
  }
  try {
    for (const project of projects) {
      const node = catalog.nodes.find((n: any) => n.id === project),
        imagePeer = images.find((p: any) => p.node.id === project),
        terminalPeer = terminals.find((p: any) => p.node.id === project)
      // Only formats the project's catalog binding declares take part, so the full lists that
      // prepare writes can be passed unchanged.
      if (formats.includes('svg') && communityDeclaresOutput(node, 'svg') && imagePeer?.artifact) {
        let host: any, session: any
        try {
          imagePeer.artifact = verifiedBenchmarkBinding(imagePeer, node)
          imagePeer.node = node
          const artifact = latestBenchmarkRenderingArtifact(imagePeer)
          if (!artifact) throw Error('No prepared rendering artifact')
          const native = artifact.kind === 'cli'
          if (!native && !imagePeer.browser) throw Error('No prepared SVG public interface')
          if (!native) {
            host = await browserHost(browser, imagePeer, 'svg')
            session = await host.open()
          }
          for (const test of cases) {
            console.log(project, test.id, 'SVG')
            let svg: string, assessment: any
            try {
              if (!native && !session) session = await host.open()
              svg = native
                ? (await nativeCall(artifact, test.source, 'svg')).toString('utf8')
                : await bounded(
                    session.page.evaluate(async (c: any) => {
                      const v = await (globalThis as any).__fidelityCommunity.render(c.source, 'drawing_' + c.id.replace(/\W/g, '_'))
                      return typeof v === 'string' ? v : v.svg
                    }, test),
                    'Public SVG invocation',
                    15000,
                  )
              // Debugging only: TRIDENT_DRAWING_DUMP keeps outputs, which published runs never retain.
              if (process.env.TRIDENT_DRAWING_DUMP) writeFileSync(join(process.env.TRIDENT_DRAWING_DUMP, encodeURIComponent(project) + '.' + test.id.replace(/\W/g, '_') + '.svg'), svg)
              const format = expectsEmptyDrawing(test) ? qualifyOutputFormat(svg, 'svg') : undefined
              const admission = format ? { valid: format.ok, reason: format.findings.join('; ') } : svgTextValidity(svg, test.source)
              if (!admission.valid) throw new InadmissibleOutput(admission.reason)
              const page = await assessmentContext.newPage()
              try {
                await page.setContent('<!doctype html><style>body{margin:0}</style>' + svg)
                assessment = await bounded(assessSvgLabels(test, page, svg, labelPlans.get(test.id)), 'SVG label assessment')
              } catch (error) {
                assessment = { status: 'unknown', reason: 'SVG label observer could not assess this output: ' + String(error).slice(0, 300) }
              } finally { await page.close() }
              rows.push({ project, version: artifact.version, format: 'svg', caseId: test.id, status: assessment.status, reason: assessment.reason, failed: assessment.missing, leaked: assessment.leaked })
            } catch (error) {
              if (error instanceof InvocationTimeout && session) { await session.context.close(); session = undefined }
              // A zero-size or error-placeholder SVG is a known nonpass, not an observer gap.
              if (error instanceof InadmissibleOutput) rows.push({ project, version: artifact.version, format: 'svg', caseId: test.id, status: 'invalid-format', reason: 'Inadmissible SVG output: ' + error.message })
              else rows.push({ project, version: artifact.version, format: 'svg', caseId: test.id, status: 'renderer-failure', reason: String(error).slice(0, 400) })
            }
            save()
            if (session)
              await session.page.evaluate(() => {
                ;(globalThis as any).__communityAfterCall?.()
                for (const e of document.querySelectorAll('body > div:not([data-community-host])')) e.remove()
              })
          }
        } catch (error) {
          blocked.push({ project, format: 'svg', reason: String(error).slice(0, 400) })
        } finally {
          await session?.context.close()
          await host?.close()
        }
      } else if (formats.includes('svg') && communityDeclaresOutput(node, 'svg')) blocked.push({ project, format: 'svg', reason: imagePeer?.error ?? 'No prepared public artifact; setup remains isolated' })
      if (formats.includes('terminal') && communityDeclaresOutput(node, 'terminal') && terminalPeer?.artifact) {
        let worker: DrawingWorker | undefined
        try {
          terminalPeer.artifact = verifiedBenchmarkBinding(terminalPeer, node)
          terminalPeer.node = node
          const a = terminalPeer.artifact,
            extra = a.additionalCli?.find((c: any) => c.outputs.includes('terminal'))?.artifact
          const native = a.kind === 'cli' ? a : !communityModuleOutputSupported(node, 'terminal') ? extra : undefined
          const openWorker = async () => {
            const python = a.kind === 'python',
              executable = python ? a.executable : /bun/i.test(a.runtime ?? '') || /\.tsx?$/.test(a.module ?? '') ? process.execPath : 'node'
            const script = join(import.meta.dirname, '../fidelity/drawing/terminal-worker.' + (python ? 'py' : 'mjs'))
            if (python && !pythonRuntimes.has(project)) pythonRuntimes.set(project, pythonRenderer(terminalPeer, script))
            const bound = pythonRuntimes.get(project)
            bound?.assertUnchanged()
            worker = new DrawingWorker(bound?.command ?? [executable, script])
            const ready = await worker.call({ type: 'init', peer: terminalPeer })
            if (!ready.ok) throw Error(ready.error)
          }
          if (!native) await openWorker()
          // A worker can die after answering one case and before its exit is observed; the
          // next write then fails. Trident restarts it and gives the case one more call, so a
          // dead transport never decides a result.
          const callWorker = async (source: string): Promise<any> => {
            const once = () => worker!.call({ source }).catch(error => ({ ok: false, error: 'Worker transport: ' + String(error) }))
            const first = await once()
            if (first.ok || !/Worker has stopped|Worker exited|Worker transport/.test(first.error ?? '')) return first
            await worker?.close()
            await openWorker()
            return once()
          }
          for (const test of cases) {
            if (!native && (!worker || worker.child.exitCode !== null)) await openWorker()
            const result = native
              ? await (async () => {
                  try {
                    return { ok: true, text: (await nativeCall(native, test.source, 'terminal')).toString('utf8') }
                  } catch (e) {
                    return { ok: false, error: String(e) }
                  }
                })()
              : await callWorker(test.source)
            if (!result.ok) {
              if (['protocol', 'closed'].includes(result.failureKind)) throw Error('Unqualified worker transport: ' + result.error)
              const stopped = /Worker has stopped|Worker exited|Worker transport/.test(result.error ?? '')
              // The worker stopped on this input twice, the second time freshly started: the
              // renderer's process cannot survive it, which is the renderer's failure.
              rows.push({ project, version: native?.version ?? a.version, format: 'terminal', caseId: test.id, status: 'renderer-failure', reason: stopped ? 'Renderer process stopped on this input, also in a fresh worker: ' + result.error : result.error })
              if (result.failureKind || stopped || /Worker timed out/.test(result.error ?? '')) {
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
            const assessed = assessTerminalLabels(test, result.text, labelPlans.get(test.id))
            rows.push({ project, version: native?.version ?? a.version, format: 'terminal', caseId: test.id, status: assessed.status, reason: assessed.reason, failed: assessed.missing, leaked: assessed.leaked })
            save()
          }
        } catch (error) {
          blocked.push({ project, format: 'terminal', reason: String(error).slice(0, 400) })
          for (const pending of cases) if (!rows.some(r => r.project === project && r.format === 'terminal' && r.caseId === pending.id)) rows.push({ project, version: terminalPeer.artifact.version, format: 'terminal', caseId: pending.id, status: 'unrun', reason: 'Public worker unavailable' })
        } finally {
          await worker?.close()
        }
      } else if (formats.includes('terminal') && communityDeclaresOutput(node, 'terminal')) blocked.push({ project, format: 'terminal', reason: terminalPeer?.error ?? 'No prepared terminal artifact supplied' })
      save('running', true)
    }
    for (const runtime of pythonRuntimes.values()) runtime.assertUnchanged()
    save('complete')
  } finally {
    await assessmentContext.close()
    await browser.close()
  }
  console.log(JSON.stringify({ cases: cases.length, assessedRows: rows.length, blocked }))
}
if (import.meta.main) await main()
