import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sourceScripts from './agentic-scripts.json' with { type: 'json' }
import { withAgenticWorkspace, tridentRoot as directory } from './workspace.ts'
import { assertBenchmarkExecutionAllowed } from '../../ci-policy.ts'

const help = `Agentic Mermaid source adapter — optional project-specific diagnostics

bun commands.ts adapter agentic run --list --profile full
bun commands.ts adapter agentic run --suites ID --out DIRECTORY [options]
bun commands.ts adapter agentic source SCRIPT [options]
bun commands.ts adapter agentic test
bun commands.ts adapter agentic typecheck
bun commands.ts adapter agentic community [options]
bun commands.ts adapter agentic prs [options]
bun commands.ts adapter agentic corpus:import

Set TRIDENT_AGENTIC_ROOT explicitly. Install/build that source checkout first.
These diagnostics import that project's source or exercise its product contracts.
Their results are not evidence for another catalog project. Public community
comparisons use community:update and the same release/candidate rules for every tool.
No measurement runs in CI. --help needs no checkout, oracle or build.
`

function sourceCheckout(): string {
  const explicit = process.env.TRIDENT_AGENTIC_ROOT ?? process.env.AM_BENCH_REPOSITORY_ROOT
  if (!explicit) throw Error('Set TRIDENT_AGENTIC_ROOT to the source checkout for this explicit adapter')
  const candidate = resolve(explicit)
  let agentic = false
  try {
    agentic = JSON.parse(readFileSync(resolve(candidate, 'package.json'), 'utf8')).name === 'agentic-mermaid'
  } catch {}
  if (!agentic) throw Error('Optional Agentic source adapter unavailable. Set TRIDENT_AGENTIC_ROOT to an Agentic Mermaid checkout; public Trident commands do not require it.')
  return candidate
}

function sourceEnvironment(root: string, workspace: string): NodeJS.ProcessEnv {
  return { ...process.env, TRIDENT_AGENTIC_ROOT: workspace, MERMAID_UPSTREAM_DIR: process.env.MERMAID_UPSTREAM_DIR ?? resolve(root, '../mermaid'), MERMAID_REFERENCE_DIR: process.env.MERMAID_REFERENCE_DIR ?? resolve(root, '../mermaid-reference') }
}

function externalPaths(args: string[]): string[] {
  const paths = new Set(['--out', '--output', '--records', '--benchmark-records', '--community-records', '--json', '--markdown', '--target', '--package-root', '--site', '--ownership-site', '--candidate-tarball', '--baseline-tarball', '--baseline-lock', '--mermaid-dir', '--reference-dir', '--zenuml-root', '--upstream-runner-root', '--community-artifacts', '--community-prepared', '--community-inputs', '--community-browser-prepared', '--community-catalog', '--community-qualification-assets', '--portable-artifact-root', '--benchmark-resume-attempt'])
  return args.map((value, index) => index > 0 && paths.has(args[index - 1]!) && !value.startsWith('--') ? resolve(value) : value)
}

export async function runAgentic(argv: string[]) {
  const [command, ...args] = argv
  if (!command || command === '--help' || command === 'help' || args.includes('--help')) { console.log(help); return }
  if (!process.versions.bun) throw Error('Source adapters require Bun 1.4 or later')
  if (command === 'source') {
    const id = args.shift()
    if (!id || !Object.hasOwn(sourceScripts, id)) throw Error('Choose a declared source diagnostic: ' + Object.keys(sourceScripts).join(', '))
    assertBenchmarkExecutionAllowed()
    const root = sourceCheckout()
    const forwarded = externalPaths(args)
    if (id === 'bench:modern-summary' && forwarded[0]) forwarded[0] = resolve(forwarded[0])
    if (id === 'bench:endpoint-marker') for (let index = 0; index < Math.min(3, forwarded.length); index++) forwarded[index] = resolve(forwarded[index]!)
    if (id === 'bench:scorecard') {
      if (!forwarded.includes('--output')) forwarded.push('--output', resolve(root, 'bench-report/community-benchmark-ranking.md'))
      const input = forwarded.indexOf('--run')
      if (input >= 0 && forwarded[input + 1] && !forwarded[input + 1]!.startsWith('--')) forwarded[input + 1] = resolve(forwarded[input + 1]!)
    }
    withAgenticWorkspace(root, false, workspace => {
      const result = spawnSync(process.execPath, ['run', id, ...forwarded], { cwd: workspace, stdio: 'inherit', env: sourceEnvironment(root, workspace) })
      if (result.error) throw result.error
      process.exitCode = result.status ?? 1
    })
    return
  }
  if (command === 'corpus:import') {
    const root = sourceCheckout()
    const result = spawnSync(process.execPath, ['run', resolve(directory, 'unified/corpus-import.ts'), ...args], { cwd: directory, stdio: 'inherit', env: { ...process.env, TRIDENT_AGENTIC_ROOT: root } })
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
    return
  }
  const selected = command === 'run' || command === 'bench' ? 'agentic' : command
  const source: Record<string, string> = { agentic: 'unified/run.ts', community: 'unified/community-campaign.ts', prs: 'unified/pr-campaign.ts' }
  if (!source[selected] && selected !== 'test' && selected !== 'typecheck') throw Error('Unknown source adapter command ' + command + '; use adapter agentic --help')
  const root = sourceCheckout()
  assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: selected !== 'typecheck' && !args.includes('--help') && !args.includes('--list') })
  const selectedRoot = root

  const forwarded = externalPaths(args)
  if (source[selected] && selected !== 'prs') {
    if (process.env.AM_CHROMIUM_EXECUTABLE && !forwarded.includes('--executable')) forwarded.push('--executable', process.env.AM_CHROMIUM_EXECUTABLE)
    for (const [flag, value] of [['--target', selectedRoot], ['--mermaid-dir', process.env.MERMAID_UPSTREAM_DIR ?? resolve(selectedRoot, '../mermaid')], ['--reference-dir', process.env.MERMAID_REFERENCE_DIR ?? resolve(selectedRoot, '../mermaid-reference')]]) if (!forwarded.includes(flag!)) forwarded.push(flag!, value!)
  }
  if (source[selected] && !forwarded.includes('--out') && !forwarded.includes('--help')) forwarded.push('--out', resolve(selectedRoot, 'bench-report/trident', selected))
  withAgenticWorkspace(selectedRoot, selected === 'test' || selected === 'typecheck' || args.includes('--list') || args.includes('--help'), workspace => {
    const packageRoot = resolve(workspace, 'eval/benchmark')
    const target = source[selected]
    const command = target ? ['run', resolve(packageRoot, target)] : selected === 'test' ? ['test', '--timeout', '30000', '--parallel=2', resolve(packageRoot, 'tests')] : ['x', '--no-install', 'tsc', '--noEmit', '-p', resolve(packageRoot, 'tsconfig.json')]
    const result = spawnSync(process.execPath, [...command, ...forwarded], { cwd: workspace, stdio: 'inherit', env: sourceEnvironment(selectedRoot, workspace) })
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
  })
  return
}
