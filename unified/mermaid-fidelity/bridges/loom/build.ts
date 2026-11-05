// Yassimba/loom: its per-family parsers are module-private functions. Copy the
// package's own source tree unchanged and append `export { parseX }` lines so
// the bridge can call them; no parsing statement is altered.
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const loomParsers: Record<string, [file: string, fn: string]> = {
  flowchart: ['flowchart.ts', 'parseGraph'], class: ['class.ts', 'parseClass'], er: ['er.ts', 'parseEr'], state: ['state.ts', 'parseState'],
  sequence: ['sequence.ts', 'parseSequence'], architecture: ['architecture.ts', 'parseArchitecture'], pie: ['pie.ts', 'parsePie'],
  mindmap: ['mindmap.ts', 'parseMindmap'], timeline: ['timeline.ts', 'parseTimeline'], gitgraph: ['gitgraph.ts', 'parseGitGraph'],
}

export async function build(peer: any, outDir: string): Promise<string[]> {
  const root = peer?.artifact?.root
  if (!root || !existsSync(join(root, 'src/loom-mermaid/diagrams'))) throw Error('Prepared Loom artifact has no src/loom-mermaid source tree')
  const copy = join(outDir, 'loom-mermaid-' + peer.artifact.version)
  if (!existsSync(join(copy, '.complete'))) {
    cpSync(join(root, 'src/loom-mermaid'), copy, { recursive: true })
    for (const [file, fn] of Object.values(loomParsers)) {
      const path = join(copy, 'diagrams', file), text = readFileSync(path, 'utf8')
      if (!new RegExp('^function ' + fn + '\\(', 'm').test(text)) throw Error(`Loom ${file} no longer defines ${fn}`)
      writeFileSync(path, text + `\nexport { ${fn} } // appended by Trident's Fidelity bridge\n`)
    }
    writeFileSync(join(copy, '.complete'), peer.artifact.version)
  }
  return [process.execPath, join(import.meta.dirname, 'bridge.ts'), copy]
}
