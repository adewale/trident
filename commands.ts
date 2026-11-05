import { TRIDENT_VERSION } from './version.ts'
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertBenchmarkExecutionAllowed } from './ci-policy.ts'

const directory = dirname(fileURLToPath(import.meta.url))
const help = `Trident — three benchmarks of Mermaid implementations

Setup:
  node commands.ts mermaid:install [--dir DIRECTORY]
  bun commands.ts upstream:prepare --source PINNED_CHECKOUT --runtime FRESH_DIRECTORY
  bun commands.ts versions --out FRESH_DIRECTORY [--projects IDS]
  bun commands.ts prepare --catalog FROZEN_CATALOG --out FRESH_DIRECTORY [--projects IDS]

Benchmarks:
  bun commands.ts davebench --out FRESH_DIRECTORY [--prepared FILE] [--projects IDS]
  bun commands.ts davebench:terminal --prepared FILE --out FRESH_DIRECTORY
  bun commands.ts davebench:native-png --help
  bun commands.ts drawing:correctness --help
  bun commands.ts mermaid:fidelity --help

Results (read existing numbers; launch no renderers):
  bun commands.ts campaign:results --help
  bun commands.ts results:snapshot [--check]

Version: node commands.ts --version

Maintainer checks (Bun): test (local full suite), test:ci (CI suite), typecheck, lint

See README.md for the benchmarks and docs/benchmark-results-details.md for methods.
--help starts no benchmark and needs no oracle. Use COMMAND --help for options.
Benchmarks are local operations; Trident refuses to run them in CI.
`
/** Every tests/*.test.ts except the reviewed exclusions, each with its reason, in tests/ci-skip.json. */
export function ciTestFiles(root: string) {
  const skips: Record<string, string> = JSON.parse(readFileSync(resolve(root, 'tests/ci-skip.json'), 'utf8')).skip
  const files = readdirSync(resolve(root, 'tests')).filter(name => name.endsWith('.test.ts')).sort()
  for (const [name, reason] of Object.entries(skips)) if (!files.includes(name + '.test.ts') || !reason.trim()) throw Error('tests/ci-skip.json: ' + name + (reason.trim() ? ' has no test file' : ' has no reason'))
  return files.filter(name => !Object.hasOwn(skips, name.slice(0, -'.test.ts'.length))).map(name => resolve(root, 'tests', name))
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  if (['--version', 'version'].includes(command ?? '') && args.length === 0) { console.log('Trident ' + TRIDENT_VERSION); return }
  if (!command || command === '--help' || command === 'help') { console.log(help); return }
  const own: Record<string, string> = { davebench: 'unified/davebench.ts', 'davebench:terminal': 'unified/davebench-terminal.ts', 'davebench:native-png': 'unified/davebench-native-png.ts', 'drawing:correctness': 'unified/drawing-correctness.ts', 'mermaid:fidelity': 'unified/mermaid-fidelity.ts', 'campaign:results': 'unified/three-benchmark-report.ts', versions: 'unified/benchmark-versions.ts', prepare: 'unified/prepare-artifacts.ts', 'upstream:prepare': 'unified/prepare-upstream.ts', 'results:snapshot': 'unified/results-snapshot.ts' }
  const checks: Record<string, string[]> = {
    test: ['test', '--timeout', '30000', resolve(directory, 'tests')],
    // Every test file runs in CI except the reviewed exclusions in tests/ci-skip.json.
    'test:ci': ['test', '--timeout', '30000', ...ciTestFiles(directory)],

    typecheck: ['x', '--no-install', 'tsc', '--noEmit', '-p', resolve(directory, 'tsconfig.json')],
    lint: ['x', '--no-install', 'biome', 'lint', '--config-path', resolve(directory, 'biome.json'), directory],
  }
  if (command === 'mermaid:install') {
    const usage = 'mermaid:install [--dir DIRECTORY]\nInstalls the pinned Mermaid oracle (the control every benchmark checks against) into DIRECTORY,\nby default ../mermaid-reference beside this checkout or MERMAID_REFERENCE_DIR.'
    if (args.length === 1 && args[0] === '--help') { console.log(usage); return }
    if (args.length && (args.length !== 2 || args[0] !== '--dir')) throw Error('Use ' + usage.split('\n')[0])
    assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
    const { installMermaidOracle, mermaidOracleDirectory } = await import('./portable/mermaid-oracle.ts')
    console.log(JSON.stringify(installMermaidOracle(args[1] ? resolve(args[1]) : mermaidOracleDirectory()), null, 2))
    return
  }
  if (!Object.hasOwn(own, command) && !Object.hasOwn(checks, command)) throw Error(`Unknown Trident command ${command}; use --help`)
  if (!process.versions.bun) throw Error(`${command} requires Bun 1.4 or later`)
  const argv = own[command] ? ['run', resolve(directory, own[command]!)] : checks[command]!
  const offline = ['test:ci', 'typecheck', 'lint', 'results:snapshot']
  if (!offline.includes(command) && !args.includes('--help')) assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: !['davebench', 'prepare', 'upstream:prepare'].includes(command) })
  const result = spawnSync(process.execPath, [...argv, ...args], { cwd: directory, stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}
await main()
