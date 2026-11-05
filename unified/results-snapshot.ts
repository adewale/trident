import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { retainedBenchmarkLeagues, currentBenchmarkResultFiles } from './three-benchmark-report.ts'
import { factOutputs, publishedFacts } from './published-facts.ts'

/** League-table display names that differ from the catalog's comparison branding. */
export const projectNames: Record<string, string> = {
  'adewale/agentic-mermaid': 'Agentic Mermaid', 'lukilabs/beautiful-mermaid': 'Beautiful Mermaid', 'Dicklesworthstone/frankenmermaid': 'Frankenmermaid',
  'orestesgaolin/mermaid': 'Mermaid Dart', 'mermaid-js/mermaid': 'Mermaid', 'obsidianmd/pele': 'Pele', 'dfadler/zombie-mermaid': 'Zombie Mermaid',
  'xai-org/grok-build': 'Grok renderer', 'Latias94/merman': 'Latias Merman', 'kitlangton/merman': 'Kitlangton Merman', 'crafter-station/mermaid': 'Crafter Mermaid',
  'evangwt/xmermaid': 'XMermaid', 'sandyyst/dsh-plugin-mermaid-gb-svg': 'DSH Mermaid GB SVG', '1jehuang/mermaid-rs-renderer': 'Mermaid RS Renderer',
  'emtyty/merslim': 'Merslim', 'KlangHaus/vitepress-plugin-diagram': 'VitePress Plugin Diagram', 'AlexanderGrooff/mermaid-ascii': 'Mermaid ASCII',
  'anomalyco/opencode': 'OpenCode Merman', 'fasouto/termaid': 'Termaid', 'Mootikins/figurehead-rs': 'Figurehead', 'tariqshams/mermaidtui': 'MermaidTUI',
  'Yassimba/loom': 'Loom renderer',
}

/** Regenerates RESULTS.md and every generated number quoted in the docs from the
 * current result files; with check, verifies the tracked copies instead of writing. */
export function writeSnapshot(root: string, check = false, names = projectNames) {
  const leagues = retainedBenchmarkLeagues(root, names)
  if (leagues === undefined) throw Error('Current league tables require all three benchmark result files and the frozen catalog')
  const [davebench, drawing, fidelity] = currentBenchmarkResultFiles.slice(0, 3).map(path => JSON.parse(readFileSync(join(root, path), 'utf8')))
  const outputs: [string, string][] = [[join(root, 'RESULTS.md'), leagues], ...factOutputs(root, () => publishedFacts(davebench, drawing, fidelity))]
  for (const [path, expected] of outputs)
    if (check) { if (!existsSync(path) || readFileSync(path, 'utf8') !== expected) throw Error('Results snapshot is stale: ' + path + ' (run bun commands.ts results:snapshot)') }
    else writeFileSync(path, expected)
}

export function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help')) { console.log('bun commands.ts results:snapshot [--out REPOSITORY_ROOT] [--check]\nRegenerates RESULTS.md and the generated numbers in the docs from the current result files, without running benchmarks. --check verifies tracked output without writing.'); return }
  let out = resolve(import.meta.dir, '..'), check = false
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]!
    if (flag === '--check' && !check) { check = true; continue }
    const value = argv[++index]
    if (flag === '--out' && value && !value.startsWith('--')) { out = resolve(value); continue }
    throw Error('Unknown, duplicate or incomplete option: ' + flag)
  }
  writeSnapshot(out, check)
  console.log(check ? 'Results snapshot is current.' : 'Updated ' + join(out, 'RESULTS.md'))
}
if (import.meta.main) main()
