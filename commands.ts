import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sourceScripts from './integration/agentic-scripts.json' with { type: 'json' }
import { withAgenticWorkspace } from './integration/workspace.ts'
import { assertBenchmarkExecutionAllowed } from './ci-policy.ts'

const directory = dirname(fileURLToPath(import.meta.url))
const help = `Trident — local Mermaid artifact benchmarks and retained evidence

node commands.ts build [--out FRESH_DIRECTORY]
node commands.ts run --project OWNER/TOOL --artifact-root INSTALLED_PACKAGE [options]
node commands.ts fidelity:report --core REPORT [--community REPORT] --out DIRECTORY
node commands.ts export --input FILE [--out FRESH_FILE]

build defaults to portable/dist. run requires that compiled kit and uses Node 24;
set NODE_BIN to its executable. A custom --out kit runs via node KIT/run.mjs.
These commands need no Agentic checkout. Build accepts Node 24 or Bun 1.4+.

Optional Agentic Mermaid source adapter (Bun):
  bun commands.ts agentic --list --profile full
  bun commands.ts community [options]
  bun commands.ts community:update [options]
  bun commands.ts prs [options]
Set TRIDENT_AGENTIC_ROOT to an Agentic Mermaid checkout. Trident assembles its owning protocols beside that public source in a disposable
workspace. No old Agentic benchmark package or session files are required. The containing checkout is detected only when its package name is
agentic-mermaid. AM_BENCH_REPOSITORY_ROOT remains a compatibility alias.

Aliases: bench=agentic, portable:build=build. portable keeps legacy source-mode
execution with its committed-source identity; run uses compiled measurement bytes.
Maintainer checks: test, typecheck, lint. Full tests/typechecking include optional
Agentic source adapters; run them in the Agentic checkout.
All measurement commands reject CI. --help does not start a benchmark.
`

function sourceCheckout(): string {
  const explicit = process.env.TRIDENT_AGENTIC_ROOT ?? process.env.AM_BENCH_REPOSITORY_ROOT
  const candidate = resolve(explicit ?? resolve(directory, '../..'))
  let agentic = false
  try {
    agentic = JSON.parse(readFileSync(resolve(candidate, 'package.json'), 'utf8')).name === 'agentic-mermaid'
  } catch {}
  if (!agentic) throw Error('Optional Agentic source adapter unavailable. Set TRIDENT_AGENTIC_ROOT to an Agentic Mermaid checkout; standalone run/build/fidelity:report do not require it.')
  return candidate
}

function sourceEnvironment(root: string, workspace: string): NodeJS.ProcessEnv {
  return { ...process.env, TRIDENT_AGENTIC_ROOT: workspace, MERMAID_UPSTREAM_DIR: process.env.MERMAID_UPSTREAM_DIR ?? resolve(root, '../mermaid'), MERMAID_REFERENCE_DIR: process.env.MERMAID_REFERENCE_DIR ?? resolve(root, '../mermaid-reference') }
}

function externalPaths(args: string[]): string[] {
  const paths = new Set(['--out', '--output', '--records', '--benchmark-records', '--community-records', '--json', '--markdown', '--target', '--package-root', '--site', '--ownership-site', '--candidate-tarball', '--baseline-tarball', '--baseline-lock', '--mermaid-dir', '--reference-dir', '--zenuml-root', '--upstream-runner-root', '--community-artifacts', '--community-prepared', '--community-inputs', '--community-browser-prepared', '--community-catalog', '--community-qualification-assets', '--portable-artifact-root', '--benchmark-resume-attempt'])
  return args.map((value, index) => index > 0 && paths.has(args[index - 1]!) && !value.startsWith('--') ? resolve(value) : value)
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'source') {
    const id = args.shift()
    if (!id || !Object.hasOwn(sourceScripts, id)) throw Error('Choose a declared source diagnostic: ' + Object.keys(sourceScripts).join(', '))
    assertBenchmarkExecutionAllowed()
    const root = sourceCheckout()
    const forwarded = externalPaths(args)
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
  if (!command || command === '--help' || command === 'help') {
    console.log(help)
    return
  }
  const aliases: Record<string, string> = { 'portable:build': 'build', bench: 'agentic' }
  const selected = Object.hasOwn(aliases, command) ? aliases[command]! : command
  const neutral: Record<string, string> = { build: 'portable/build.ts', portable: 'portable/run.ts', 'fidelity:report': 'fidelity/report.ts' }
  const source: Record<string, string> = { agentic: 'unified/run.ts', community: 'unified/community-campaign.ts', 'community:update': 'unified/project-update.ts', prs: 'unified/pr-campaign.ts' }
  const checks: Record<string, string[]> = {
    test: ['test', '--timeout', '30000', '--parallel=2', resolve(directory, 'tests')],
    typecheck: ['x', '--no-install', 'tsc', '--noEmit', '-p', resolve(directory, 'tsconfig.json')],
    lint: ['x', '--no-install', 'biome', 'lint', '--config-path', resolve(directory, 'biome.json'), directory],
  }
  if (selected === 'export') {
    const usage = 'export --input FILE [--out FRESH_FILE]'
    if (args.length === 1 && args[0] === '--help') {
      console.log('node commands.ts ' + usage)
      return
    }
    const paths = new Map<string, string>()
    for (let index = 0; index < args.length; index += 2) {
      const flag = args[index]!,
        value = args[index + 1]
      if (!['--input', '--out'].includes(flag) || paths.has(flag) || !value || value.startsWith('--')) throw Error('Use ' + usage)
      paths.set(flag, resolve(directory, value))
    }
    if (!paths.has('--input')) throw Error('Use ' + usage)
    const { readBenchmarkDocument } = await import('./portable/project-records.ts')
    const output = JSON.stringify(readBenchmarkDocument(paths.get('--input')!), null, 2) + '\n'
    if (paths.has('--out')) writeFileSync(paths.get('--out')!, output, { flag: 'wx' })
    else process.stdout.write(output)
    return
  }
  if (selected !== 'run' && !Object.hasOwn(neutral, selected) && !Object.hasOwn(source, selected) && !Object.hasOwn(checks, selected)) throw Error(`Unknown Trident command ${command}; use --help`)
  if (selected === 'build' && args.length === 1 && args[0] === '--help') {
    console.log('node commands.ts build [--out FRESH_DIRECTORY]\nDefault: portable/dist. Copy the complete generated kit and its manifest; execute run.mjs with plain Node 24.')
    return
  }
  let cwd = directory,
    executable = process.execPath,
    argv: string[]
  if (selected === 'run') {
    const compiled = resolve(directory, 'portable/dist/run.mjs')
    if (!existsSync(compiled) || !existsSync(resolve(directory, 'portable/dist/harness-artifact.json'))) throw Error('Trident compiled kit is missing. Run node commands.ts build first; a custom --out kit runs via node KIT/run.mjs.')
    executable = process.env.NODE_BIN ?? (process.versions.bun ? 'node' : process.execPath)
    argv = [compiled]
  } else if (source[selected] || selected === 'test' || selected === 'typecheck') {
    cwd = sourceCheckout()
    if (!process.versions.bun) throw Error('The optional Agentic source adapter and maintainer tests require Bun 1.4 or later. Neutral build/run/fidelity:report accept Node 24.')
    assertBenchmarkExecutionAllowed()
    const selectedRoot = cwd
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
  } else if (neutral[selected]) {
    const script = resolve(directory, neutral[selected]!)
    argv = process.versions.bun ? ['run', script] : [script]
  } else if (checks[selected]) {
    if (!process.versions.bun) throw Error('Maintainer checks require Bun 1.4 or later')
    argv = checks[selected]!
  } else throw Error(`Unknown Trident command ${command}; use --help`)
  assertBenchmarkExecutionAllowed()
  const result = spawnSync(executable, [...argv, ...args], { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}
await main()
