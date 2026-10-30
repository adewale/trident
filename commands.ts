import { TRIDENT_VERSION } from './version.ts'
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertBenchmarkExecutionAllowed } from './ci-policy.ts'

const directory = dirname(fileURLToPath(import.meta.url))
const help = `Trident — benchmarks for Mermaid renderers, terminal tools and parsers

Benchmark catalog projects (Bun):
  bun commands.ts support [--lineage] [--out FILE.md|json]
  bun commands.ts support:verify --prepared FILE --out FRESH_DIRECTORY
  bun commands.ts bench --projects OWNER/TOOL[,...] --plan
  bun commands.ts bench --prepare --all-projects --cutoff UTC --out DIR
  bun commands.ts bench --prepared FILE --profile full --budget-minutes N --out DIR
  bun commands.ts bench --list
  bun commands.ts community:update --projects OWNER/TOOL[,...] --records DIR --out DIR
  bun commands.ts community:update --help
  bun commands.ts results:publish --records DIR --out DIR
  bun commands.ts results:compare --records DIR --project OWNER/TOOL [--out FILE]
  bun commands.ts docs:png --out FRESH_DIR [--rounds 5] [--native-bundle DIR]
  bun commands.ts results:campaign --campaign DIR --out FRESH_DIR [--copy-evidence]
  bun commands.ts results:snapshot [--campaign DIR --evidence-url HTTPS_DIRECTORY] [--check]
  bun commands.ts corpus:freeze --policy FILE --out FRESH_FILE

Benchmark an installed artifact (Node 24):
  node commands.ts build [--out FRESH_DIRECTORY]
  node commands.ts run --project OWNER/TOOL --artifact-root INSTALLED_PACKAGE [options]

Setup and read evidence:
  node commands.ts mermaid:install [--dir DIRECTORY]
  bun commands.ts upstream:prepare --source PINNED_CHECKOUT --runtime FRESH_DIRECTORY
  node commands.ts fidelity:report --core REPORT [--community REPORT] --out DIRECTORY
  node commands.ts export --input FILE [--out FRESH_FILE]

Version: node commands.ts --version

Maintainer checks (Bun): test (local full suite), test:ci (fixtures), typecheck, lint
  bun commands.ts release:check --prepared FILE --projects SVG_PROJECT,TERMINAL_PROJECT --out DIR

See BENCHMARKS.md for questions, usefulness, limitations and prerequisites.
Core comparisons exclude whole-application editor workflows and descendants without distinct recorded branding,
zero-ahead versions and shared-engine bindings. See support --lineage; override
with --include-excluded-descendants only for a fork/version/runtime investigation.
Public commands need no source checkout of a benchmarked project. Every tool uses
its catalog release, or the same explicit --candidate-* options. Build defaults
to portable/dist; custom kits run via node KIT/run.mjs. Measurements reject CI.
--help starts no benchmark and needs no oracle. Use COMMAND --help for options.
`
async function main() {
  const [command, ...args] = process.argv.slice(2)
  if (['--version', 'version'].includes(command ?? '') && args.length === 0) { console.log('Trident ' + TRIDENT_VERSION); return }
  if (!command || command === '--help' || command === 'help') { console.log(help); return }
  const aliases: Record<string, string> = { 'portable:build': 'build', community: 'community:update' }
  const selected = Object.hasOwn(aliases, command) ? aliases[command]! : command
  const neutral: Record<string, string> = { build: 'portable/build.ts', portable: 'portable/run.ts', 'fidelity:report': 'fidelity/report.ts' }
const own: Record<string, string> = { 'release:check': 'scripts/package-release.ts', 'docs:png': 'unified/docs-png-benchmark.ts', 'upstream:prepare': 'unified/prepare-upstream.ts', 'support:verify': 'unified/support-verification.ts', support: 'unified/support-command.ts', bench: 'unified/benchmark.ts', 'corpus:freeze': 'unified/external-corpus.ts', 'results:campaign': 'unified/campaign-publication.ts', 'results:snapshot': 'unified/results-snapshot.ts', 'community:update': 'unified/project-update.ts', 'results:publish': 'unified/league.ts', 'results:compare': 'unified/candidate-comparison.ts' }
  const checks: Record<string, string[]> = {
    test: ['test', '--timeout', '30000', resolve(directory, 'tests')],
    'test:ci': ['test', '--timeout', '30000', ...['commands', 'ci-commands', 'png-launchers', 'results-snapshot', 'portable-family-paint', 'campaign-workflows', 'campaign-preparation-regressions', 'campaign-reporting-regressions', 'campaign-resume-regressions', 'release-workflow-regressions', 'physical-paths'].map(name => resolve(directory, `tests/${name}.test.ts`))],
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
  if (selected === 'mermaid:install') {
    if (args.length && (args.length !== 2 || args[0] !== '--dir')) throw Error('Use mermaid:install [--dir DIRECTORY]')
    assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
    const { installMermaidOracle, mermaidOracleDirectory } = await import('./portable/mermaid-oracle.ts')
    console.log(JSON.stringify(installMermaidOracle(args[1] ? resolve(args[1]) : mermaidOracleDirectory()), null, 2))
    return
  }
  if (selected !== 'run' && !Object.hasOwn(neutral, selected) && !Object.hasOwn(own, selected) && !Object.hasOwn(checks, selected)) throw Error(`Unknown Trident command ${command}; use --help`)
  if (selected === 'build' && args.length === 1 && args[0] === '--help') {
    console.log('node commands.ts build [--out FRESH_DIRECTORY]\nDefault: portable/dist. Copy the complete generated kit and its manifest; execute run.mjs with plain Node 24.')
    return
  }
  const cwd = directory
  let executable = process.execPath, argv: string[]
  if (selected === 'run') {
    if (args.length === 1 && args[0] === '--help') {
      const { PORTABLE_HELP } = await import('./portable/help.ts')
      console.log(PORTABLE_HELP)
      return
    }
    const compiled = resolve(directory, 'portable/dist/run.mjs')
    if (!existsSync(compiled) || !existsSync(resolve(directory, 'portable/dist/harness-artifact.json'))) throw Error('Trident compiled kit is missing. Run node commands.ts build first; a custom --out kit runs via node KIT/run.mjs.')
    executable = process.env.NODE_BIN ?? (process.versions.bun ? 'node' : process.execPath)
    argv = [compiled]
  } else if (own[selected]) {
    if (!process.versions.bun) throw Error(`${selected} requires Bun 1.4 or later`)
    argv = ['run', resolve(directory, own[selected]!)]
  } else if (neutral[selected]) {
    const script = resolve(directory, neutral[selected]!)
    argv = process.versions.bun ? ['run', script] : [script]
  } else if (checks[selected]) {
    if (!process.versions.bun) throw Error('Maintainer checks require Bun 1.4 or later')
    argv = checks[selected]!
  } else throw Error(`Unknown Trident command ${command}; use --help`)
  const offline = ['test:ci', 'typecheck', 'lint', 'results:snapshot', 'support', 'results:campaign', 'build', 'fidelity:report', 'results:publish', 'results:compare']
  const inspectOnly = args.includes('--help') || selected === 'bench' && (args.includes('--list') || args.includes('--plan') || args.includes('--pilot-summary'))
  // community:update --plan acquires artifacts, unlike bench --plan.
  if (!offline.includes(selected) && !inspectOnly) assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: !['upstream:prepare'].includes(selected) })
  const result = spawnSync(executable, [...argv, ...args], { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}
await main()
