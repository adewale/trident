import type { TerminalProjectCase } from './terminal-corpus.ts'

/** Preserve the frozen source and historical contract while independent source
 * review resolves a disputed interpretation. No renderer output can clear a
 * hold, and no automatic admission-registry refresh supplies that review. */
export function terminalSourceInterpretationHold(input: Pick<TerminalProjectCase, 'id' | 'sourceSha256'>) {
  if (input.id !== 'terminal:9972eaa8ca8692d8' || input.sourceSha256 !== '9972eaa8ca8692d847b516eaef201d8a03a6666830f62033b2c6b0e8b39c1186') return
  return {
    status: 'incomplete-source-review' as const,
    finding: 'nested-state-global-versus-lexical-identities',
    sourceSha256: input.sourceSha256,
    reason: 'The historical contract assumes nine lexical state identities, while the original nested-state OOM reproducer reuses B/C across scopes and pinned public state-DB semantics may use global identities. Independent source resolution is pending; neither a six-state pass nor a renderer fault is established.',
  }
}
