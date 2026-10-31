import { inspectTerminalMeaning } from './terminal.ts'
import type { TerminalProjectCase } from './terminal-corpus.ts'
/** Never infer whole-drawing correctness from text admission, source tags,
 * source-reference agreement or an absent observer for a different family. */
export function assessTerminalDrawing(input: TerminalProjectCase, output?: string) {
  if (input.intent === 'invalid') return { status: 'unknown', reason: 'Reviewed invalid source belongs in a separate typed-rejection table; no drawing pass or grammar rejection is inferred from a command exit.' }
  if (input.expected.status !== 'independently-reviewed' || !input.expected.graph) return { status: 'unknown', reason: 'No independently reviewed drawing expectation for this exact source.' }
  if (input.expected.unverifiedFacts?.length) return { status: 'unknown', reason: 'Required source facts lack an observer: ' + input.expected.unverifiedFacts.join('; ') }
  if (input.family !== 'flowchart') return { status: 'unknown', reason: 'No reviewed terminal drawing observer for ' + input.family }
  if (output === undefined) return { status: 'unknown', reason: 'No retained terminal output; inspect transport/setup evidence separately.' }
  return inspectTerminalMeaning(output, input.expected.graph)
}
