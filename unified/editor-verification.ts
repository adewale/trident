import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, relative, resolve, sep } from 'node:path'
import { chromium } from 'playwright'
import { readCatalog } from './support.ts'
import { communityCatalogFile } from './trident-paths.ts'
import { isRenderedSourceEcho } from './qualification-visible-source.ts'

const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
/** A common source -> edit -> preview -> error -> recovery contract. This
 * exercises the application, not an imported copy of its rendering dependency. */
export async function verifyEditor(settings: { project: string; source: string; dist: string; out: string; executable?: string }) {
  const node = readCatalog(communityCatalogFile).nodes.find(node => node.id === settings.project)
  const binding = node?.applicationContract
  if (!node || binding?.kind !== 'browser-editor') throw Error('No reviewed browser-editor workflow for ' + settings.project)
  const source = resolve(settings.source), root = resolve(settings.dist), out = resolve(settings.out)
  if (existsSync(out)) throw Error('Editor verification output must be fresh')
  const git = (...args: string[]) => execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim()
  if (git('rev-parse', 'HEAD') !== node.head) throw Error('Editor checkout differs from the catalog source pin')
  const scope = ['.', ...(binding.generatedPaths ?? []).map(path => ':!' + path)]
  git('diff', '--exit-code', node.head!, '--', ...scope)
  if (git('status', '--porcelain', '--untracked-files=all', '--', ...scope)) throw Error('Editor source checkout has unadmitted changes')
  const files = (directory: string): { path: string; sha256: string }[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(directory, entry.name)) : entry.isFile() ? [{ path: relative(root, join(directory, entry.name)), sha256: digest(join(directory, entry.name)) }] : (() => { throw Error('Application build contains an unreviewed symlink') })())
  const observedFiles = files(root)
  mkdirSync(out, { recursive: true })
  const checks: { step: string; status: string; detail?: string; output?: string }[] = []
  const remote = new Set<string>()
  const receipt: any = { protocol: 'public-browser-editor-workflow-v1', project: node.id, sourceRevision: node.head, sourceManifestSha256: digest(join(source, 'package.json')), lockSha256: digest(join(source, 'pnpm-lock.yaml')), buildRoot: root, buildFiles: observedFiles, preparation: 'Caller-supplied built application from the named checkout; build/dependency preparation remains outside this functional check. File digests identify observed output, not a reproducible-build proof.', checks, startedAt: new Date().toISOString(), scope: 'Four authored UI steps on one flowchart: input, changed preview, visible invalid-source error, recovery. Preview checks use live DOM bounds and visible authored text. Retained SVG is a DOM fragment, not a qualified standalone export. No engine rank, whole-editor coverage, timing score or export qualification.' }
  const server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
      let path = resolve(root, '.' + pathname)
      if (!path.startsWith(root + sep) && path !== root) { response.writeHead(404).end(); return }
      if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html')
      else if (!existsSync(path) && existsSync(path + '.html')) path += '.html'
      if (!existsSync(path)) { response.writeHead(404).end(); return }
      response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.wasm': 'application/wasm', '.woff2': 'font/woff2' } as Record<string, string>)[extname(path)] ?? 'application/octet-stream')
      response.end(readFileSync(path))
    } catch { response.writeHead(400).end() }
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const url = `http://127.0.0.1:${(server.address() as any).port}`
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  try {
    browser = await chromium.launch({ headless: true, executablePath: settings.executable })
    receipt.browserVersion = browser.version()
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'en-US', reducedMotion: 'reduce' })
    await page.route('**/*', route => {
      const target = route.request().url()
      if (target.startsWith(url + '/') || /^(?:data|blob):/.test(target)) return route.continue()
      remote.add(target); return route.abort()
    })
    await page.goto(url + binding.path)
    if (binding.dismiss) { const button = page.locator(binding.dismiss).first(); try { await button.waitFor({ state: 'visible', timeout: 5000 }); await button.click() } catch {} }
    const enter = async (text: string) => {
      const editor = page.locator(binding.editor).first()
      if (binding.input === 'textarea') { await editor.click(); await editor.fill(text) }
      else { await editor.click(); await page.keyboard.press('Control+KeyA'); await page.keyboard.insertText(text) }
    }
    const preview = async (labels: string[], absent: string[] = []) => {
      const found = await page.waitForFunction(({ selector, labels, absent }) => {
        for (const svg of document.querySelectorAll(selector)) {
          const bounds = svg.getBoundingClientRect()
          const texts = [...svg.querySelectorAll('text,foreignObject')].filter(element => { const style = getComputedStyle(element), box = element.getBoundingClientRect(); return !element.closest('defs,metadata,desc,title,style,script') && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && box.width > 0 && box.height > 0 }).map(element => (element.textContent ?? '').replace(/\s+/g, ' ').trim())
          if (svg.namespaceURI === 'http://www.w3.org/2000/svg' && bounds.width > 0 && bounds.height > 0 && labels.every(label => texts.includes(label)) && absent.every(label => !texts.includes(label))) return svg.outerHTML
        }
        return false
      }, { selector: binding.preview, labels, absent }, { timeout: 25_000 })
      const svg = await found.jsonValue() as string
      if (isRenderedSourceEcho('flowchart LR\nA[' + labels[0] + '] --> B[' + labels[1] + ']', svg, 'svg')) throw Error('Preview displays source instead of a diagram')
      return svg
    }
    for (const [step, text, labels, absent] of [
      ['input', 'flowchart LR\nA[Alpha] --> B[Beta]', ['Alpha', 'Beta'], []],
      ['edit', 'flowchart LR\nA[Gamma] --> B[Delta]', ['Gamma', 'Delta'], ['Alpha', 'Beta']],
      ['invalid', 'flowchart LR\n --> -->', [], []],
      ['recovery', 'flowchart LR\nA[Alpha] --> B[Beta]', ['Alpha', 'Beta'], ['Gamma', 'Delta']],
    ] as const) {
      try {
        await enter(text)
        if (step === 'invalid') await page.locator(binding.error).filter({ hasText: /.+/ }).first().waitFor({ state: 'visible', timeout: 25_000 })
        else {
          const svg = await preview([...labels], [...absent]), file = step + '.preview.svg'
          await page.locator(binding.error).filter({ hasText: /.+/ }).first().waitFor({ state: 'hidden', timeout: 25_000 })
          writeFileSync(join(out, file), svg); checks.push({ step, status: 'passed', output: file })
          await page.screenshot({ path: join(out, step + '.png') }); continue
        }
        checks.push({ step, status: 'passed' }); await page.screenshot({ path: join(out, step + '.png') })
      } catch (error) { checks.push({ step, status: 'failed', detail: String(error) }); await page.screenshot({ path: join(out, step + '.png') }) }
    }
  } catch (error) { checks.push({ step: 'setup', status: 'blocked', detail: String(error) }) }
  finally {
    await browser?.close(); await new Promise<void>(done => server.close(() => done()))
    if (JSON.stringify(files(root)) !== JSON.stringify(observedFiles)) checks.push({ step: 'artifact-identity', status: 'blocked', detail: 'Application build changed during verification' })
    receipt.blockedExternalRequests = [...remote]; receipt.finishedAt = new Date().toISOString()
    receipt.status = checks.length === 4 && checks.every(check => check.status === 'passed') ? 'passed' : checks.some(check => check.status === 'failed') ? 'failed' : 'blocked'
    writeFileSync(join(out, 'report.json'), JSON.stringify(receipt, null, 2) + '\n')
  }
  return receipt
}
if (import.meta.main) {
  const argv = process.argv.slice(2), values = new Map<string, string>()
  if (argv.length === 1 && argv[0] === '--help') console.log('editor:verify --project ID --source PINNED_CHECKOUT --dist BUILT_APP --out FRESH_DIRECTORY [--executable CHROMIUM]\nRun the common editor UI workflow against an explicitly built pinned application; no renderer speed score.')
  else {
    for (let index = 0; index < argv.length; index += 2) { const flag = argv[index]!, value = argv[index + 1]; if (!['--project', '--source', '--dist', '--out', '--executable'].includes(flag) || !value || value.startsWith('--') || values.has(flag)) throw Error('Use editor:verify --help'); values.set(flag, value) }
    for (const flag of ['--project', '--source', '--dist', '--out']) if (!values.has(flag)) throw Error('Missing ' + flag)
    const result = await verifyEditor({ project: values.get('--project')!, source: values.get('--source')!, dist: values.get('--dist')!, out: values.get('--out')!, executable: values.get('--executable') })
    console.log(JSON.stringify({ project: result.project, status: result.status, checks: result.checks })); process.exitCode = result.status === 'passed' ? 0 : 1
  }
}
