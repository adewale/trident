import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { watchMemory } from './process-memory.ts'
import { chromium } from 'playwright'
import { drawingCases, type DrawingCase } from '../fidelity/drawing/corpus.ts'
import { DrawingWorker } from '../fidelity/drawing/worker.ts'
import { assessLabels, expectsEmptyDrawing, svgText, terminalText } from '../fidelity/drawing/labels.ts'
import { browserHost } from './davebench.ts'
import { defaultChromium } from './benchmark-context.ts'
import { latestBenchmarkRenderingArtifact, assertCurrentBenchmarkArtifact } from './benchmark-versions.ts'
import { communityModuleOutputSupported } from './community.ts'
import { comparisonProjects } from './lineage.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { svgTextValidity, terminalTextValidity } from './davebench-validity.ts'

class InadmissibleOutput extends Error {}

const nativeCall = async (artifact: any, source: string, format: string) => {
  const binding = artifact.outputBindings?.[format] ?? (format === 'terminal' ? { args: artifact.args ?? [], input: artifact.input ?? 'stdin' } : undefined)
  if (!binding) throw Error('No declared native ' + format + ' binding')
  const temporary = binding.args.some((arg: string) => arg.includes('{output}')) ? mkdtempSync(join(tmpdir(), 'trident-drawing-')) : undefined
  const destination = temporary ? join(temporary, 'output.' + format) : undefined
  try {
    const args = binding.args.map((arg: string) => (destination ? arg.replaceAll('{output}', destination) : arg))
    const result = await new Promise<{ stdout: Buffer; stderr: string; status: number | null; error?: string }>(done => {
      const child = spawn(artifact.executable, args, { stdio: ['pipe', 'pipe', 'pipe'] })
      const out: Buffer[] = []
      let stderr = '', size = 0, error: string | undefined
      child.stdout!.on('data', (chunk: Buffer) => { size += chunk.length; if (size <= 32 * 1024 * 1024) out.push(chunk) })
      child.stderr!.on('data', chunk => { if (stderr.length < 4096) stderr += String(chunk) })
      const timer = setTimeout(() => { error = 'spawn ' + artifact.executable + ' ETIMEDOUT'; child.kill('SIGKILL') }, 15000)
      const unwatch = watchMemory(child.pid, () => { error = 'memory limit'; child.kill('SIGKILL') })
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
  mkdirSync(out, { recursive: true })
  const rows: any[] = [],
    blocked: any[] = []
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
          method: 'Label assessment: a case passes when every label named by its reviewed source facts appears in the output and no raw Mermaid syntax (diagram header, node definition or piped edge label) is shown. SVG text is read from the document and terminal text directly. Edges, arrow direction, layout and styling are not checked. PNG is not assessed.',
          assessmentLimits: { invocationMs: 15000, terminalWorkerMs: 20000 },
          rows,
          blocked,
        },
        null,
        2,
      ),
    )
  const browser = await chromium.launch({ headless: true, executablePath: process.env.AM_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium) })
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
  try {
    for (const project of projects) {
      const node = catalog.nodes.find((n: any) => n.id === project),
        imagePeer = images.find((p: any) => p.node.id === project),
        terminalPeer = terminals.find((p: any) => p.node.id === project)
      if (formats.includes('svg') && imagePeer?.artifact) {
        let host: any, session: any
        try {
          assertCurrentBenchmarkArtifact(imagePeer, node)
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
              const admission = expectsEmptyDrawing(test) ? { valid: true as const } : svgTextValidity(svg, test.source)
              if (!admission.valid) throw new InadmissibleOutput(admission.reason)
              assessment = assessLabels(test, 'svg', svgText(svg))
              rows.push({ project, version: artifact.version, format: 'svg', caseId: test.id, status: assessment.status, reason: assessment.reason, failed: assessment.missing, leaked: assessment.leaked })
            } catch (error) {
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
      } else if (formats.includes('svg') && node.benchmark?.outputs.includes('svg')) blocked.push({ project, format: 'svg', reason: imagePeer?.error ?? 'No prepared public artifact; setup remains isolated' })
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
              ? await (async () => {
                  try {
                    return { ok: true, text: (await nativeCall(native, test.source, 'terminal')).toString('utf8') }
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
            const assessed = assessLabels(test, 'terminal', terminalText(result.text))
            rows.push({ project, version: native?.version ?? a.version, format: 'terminal', caseId: test.id, status: assessed.status, reason: assessed.reason, failed: assessed.missing, leaked: assessed.leaked })
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
    await browser.close()
  }
  console.log(JSON.stringify({ cases: cases.length, assessedRows: rows.length, blocked }))
}
if (import.meta.main) await main()
