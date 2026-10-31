import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import registry from '../corpus/terminal-source-adaptations.json' with { type: 'json' }
import { readTerminalCorpus, terminalSourceAuditIdentity, type TerminalProjectCase } from './terminal-corpus.ts'
import { analyseTerminalSource } from './terminal-source.ts'

/** Separate authored controls never replace the original literal inventory or
 * inherit its source admission/output grades. Every new identity needs its own
 * independent source receipt before any renderer output can be scored. */
export function readTerminalSourceAdaptations() {
  const original = readTerminalCorpus()
  return registry.cases.map(record => {
    const input = record.case as unknown as TerminalProjectCase
    const parent = original.cases.find(row => row.id === record.derivedFrom.caseId)
    if (!parent || parent.sourceSha256 !== record.derivedFrom.sourceSha256 || parent.source !== record.derivedFrom.source || evidenceDigest(parent.origins) !== evidenceDigest(record.derivedFrom.origins)) throw Error('Terminal adaptation lost its exact original source/provenance')
    if (evidenceBytesDigest(input.source) !== input.sourceSha256 || input.id !== 'terminal-adaptation:' + input.sourceSha256.slice(0, 16) || original.cases.some(row => row.sourceSha256 === input.sourceSha256)) throw Error('Terminal adaptation must have a distinct content identity')
    if (record.review.status !== 'independently-reviewed' || !record.review.reviewedBy || record.review.semanticReviewSha256 !== terminalSourceAuditIdentity(input)) throw Error('Terminal adaptation has no independent review of this exact source contract')
    const analysis = analyseTerminalSource(input.source, input.family)
    if (analysis.contract.sourceUncertainties.length || evidenceDigest(analysis.contract) !== evidenceDigest(input.expected.contract)) throw Error('Terminal adaptation source transcription differs from its independently reviewed contract')
    return input
  })
}

export function terminalSourceAdaptationStatus(input: TerminalProjectCase) {
  const reviewed = readTerminalSourceAdaptations().find(row => row.id === input.id)
  return reviewed && reviewed.source === input.source && terminalSourceAuditIdentity(input) === terminalSourceAuditIdentity(reviewed)
    ? { admitted: true, reason: 'Independent source-only adaptation review binds the fresh identity and complete contract' }
    : { admitted: false, reason: 'No independent source adaptation review binds this exact identity and contract' }
}
