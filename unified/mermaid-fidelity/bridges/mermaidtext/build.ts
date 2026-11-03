// spacedock-dev/mermaidtext: only Render is exported, so the bridge reaches the
// package's own unexported parsers through one export file (export.go.in) and a
// generated table of its integer-constant names, both injected with
// `go build -overlay`. The prepared source checkout is compiled unchanged.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const here = import.meta.dirname
const sources = ['main.go', 'walk.go', 'enumgen.go', 'export.go.in', 'go.mod.in']
const parsers = ['parseGraph(src string) *graph', 'parseState(src string) (*graph, bool)', 'parseClass(src string) (*graph, []classInfo, bool)',
  'parseER(src string) (*graph, []classInfo, bool)', 'parseSequence(src string) (*sequence, bool)']

const run = (command: string, args: string[], cwd?: string) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim()

function goTool(): string {
  for (const candidate of [process.env.GO, 'go', '/usr/local/go/bin/go']) {
    if (!candidate) continue
    try { run(candidate, ['version']); return candidate } catch {}
  }
  throw Error('mermaidtext bridge: no Go toolchain found (set GO or put go on PATH)')
}

export async function build(peer: any, outDir: string): Promise<string[]> {
  if (peer?.node?.id !== 'spacedock-dev/mermaidtext') throw Error('mermaidtext bridge: expected the spacedock-dev/mermaidtext peer, got ' + peer?.node?.id)
  const root: string | undefined = peer.artifact?.root
  const revision: string | undefined = peer.artifact?.sourceRevision ?? peer.artifact?.revision
  const source = root && join(root, 'source')
  if (!source || !revision || !existsSync(join(source, 'go.mod'))) throw Error('mermaidtext bridge: prepared artifact has no Go source checkout at <root>/source')
  if (!/^module github\.com\/spacedock-dev\/mermaidtext\s*$/m.test(readFileSync(join(source, 'go.mod'), 'utf8'))) throw Error('mermaidtext bridge: ' + source + ' is not module github.com/spacedock-dev/mermaidtext')
  const head = run('git', ['-C', source, 'rev-parse', 'HEAD'])
  if (head !== revision) throw Error(`mermaidtext bridge: source checkout is at ${head}, but the artifact records ${revision}`)
  if (run('git', ['-C', source, 'status', '--porcelain', '--untracked-files=all'])) throw Error('mermaidtext bridge: source checkout ' + source + ' has local changes')
  const code = ['parse_flowchart.go', 'parse_state.go', 'parse_class.go', 'parse_er.go', 'parse_sequence.go'].map(f => readFileSync(join(source, f), 'utf8')).join('\n')
  for (const signature of parsers) if (!code.includes('\nfunc ' + signature + ' {')) throw Error('mermaidtext bridge: source no longer defines func ' + signature)

  const go = goTool()
  mkdirSync(outDir, { recursive: true })
  const binary = join(outDir, 'mermaidtext-bridge')
  const stamp = createHash('sha256').update([source, revision, run(go, ['version']), ...sources.map(f => readFileSync(join(here, f), 'utf8'))].join('\0')).digest('hex')
  const stampFile = join(outDir, 'bridge.stamp')
  if (existsSync(binary) && existsSync(stampFile) && readFileSync(stampFile, 'utf8') === stamp) return [binary]

  const work = join(outDir, 'bridge'), overlayDir = join(outDir, 'overlay')
  mkdirSync(work, { recursive: true })
  mkdirSync(overlayDir, { recursive: true })
  for (const f of ['main.go', 'walk.go', 'enumgen.go']) copyFileSync(join(here, f), join(work, f))
  copyFileSync(join(here, 'export.go.in'), join(overlayDir, 'export.go'))
  writeFileSync(join(work, 'go.mod'), readFileSync(join(here, 'go.mod.in'), 'utf8').replace('@SOURCE@', source))
  const enums = join(overlayDir, 'enums.go')
  run(go, ['run', 'enumgen.go', source, enums], work)
  const overlay = { Replace: { [join(source, 'zz_trident_bridge_export.go')]: join(overlayDir, 'export.go'), [join(source, 'zz_trident_bridge_enums.go')]: enums } }
  writeFileSync(join(outDir, 'overlay.json'), JSON.stringify(overlay, null, 1))
  run(go, ['build', '-trimpath', '-overlay', join(outDir, 'overlay.json'), '-o', binary, '.'], work)
  writeFileSync(stampFile, stamp)
  return [binary]
}
