import { execFileSync } from 'node:child_process'
import { familyNames } from './docs-source-review.ts'
import { assertMermaidOracle, mermaidVerdicts } from '../portable/mermaid-oracle.ts'

const revision = '370c4af57f43cb0bda05f4a9fe2d99c912ba16dd'
export function davebenchInputs(upstream: string, commit = revision) {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: upstream, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
  try { git('cat-file', '-e', commit + '^{commit}') }
  catch { throw Error(`DaveBench reads Mermaid's documentation at commit ${commit}, which ${upstream} does not contain. Clone https://github.com/mermaid-js/mermaid there; davebench and davebench:terminal also accept --upstream CHECKOUT.`) }
  const files = git('ls-tree', '-r', '--name-only', commit, '--', 'docs/').trim().split('\n').filter(file => /\.mdx?$/.test(file))
  const cases: { id: string; source: string }[] = []
  for (const file of files) {
    let fence: { char: string; length: number; language: string; line: number } | undefined, body: string[] = []
    for (const [index, line] of git('show', `${commit}:${file}`).split(/(?<=\n)/).entries()) {
      if (fence) {
        if (new RegExp('^ {0,3}' + fence.char + '{' + fence.length + ',}[ \\t]*\\r?\\n?$').test(line)) {
          if (['mermaid', 'mermaid-example'].includes(fence.language)) cases.push({ id: file + ':' + fence.line, source: body.join('') })
          fence = undefined; body = []
        } else body.push(line)
      } else {
        const match = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)/.exec(line)
        if (match) fence = { char: match[1]![0]!, length: match[1]!.length, language: match[2]!.trim().split(/\s+/)[0]!, line: index + 1 }
      }
    }
  }
  if (!cases.length) throw Error('No documentation examples found')
  return { commit, files: new Set(cases.map(input => input.id.slice(0, input.id.lastIndexOf(':')))).size, cases }
}

/** The diagram family a documentation example declares: its first statement after front
 * matter, directives and comments, named as the docs review names families. Examples
 * with no recognisable header are 'other'. Used only to group results, never to admit. */
export function davebenchFamily(source: string) {
  const body = source.replace(/^﻿?\s*---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, '').replace(/%%\{[\s\S]*?\}%%/g, '')
  const header = body.split(/\r?\n/).map(line => line.trim()).find(line => line && !line.startsWith('%%'))?.split(/[\s:;{]+/)[0]?.toLowerCase() ?? ''
  if (!header) return 'other'
  if (/^c4/.test(header)) return 'c4'
  if (/^railroad/.test(header)) return 'railroad'
  return Object.hasOwn(familyNames, header) ? familyNames[header]! : /^[a-z][a-z0-9-]*$/.test(header) ? header.replace(/-beta$/, '').replace(/diagram$/, '') : 'other'
}

/** Inputs the pinned Mermaid oracle rejects (its parser or diagram detection fails), by input
 * id with the oracle's error. Collectors record this as `corpus.referenceRejected` so the
 * accepted/rejected split travels with the collection; completion is credited over the rest. */
export async function davebenchReferenceRejected(cases: readonly { id: string; source: string }[]): Promise<Record<string, string>> {
  const verdicts = await mermaidVerdicts(assertMermaidOracle(), cases.map(input => input.source))
  return Object.fromEntries(cases.flatMap((input, index) => verdicts[index]!.accepted ? [] : [[input.id, verdicts[index]!.error ?? 'rejected']]))
}
