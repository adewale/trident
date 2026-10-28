import type { UnifiedWorkload } from './types.ts'
import type { WorkloadEvidence } from './workload-evidence.ts'

/** An imported parser test does not promise a drawable diagram, even when a
 * source adapter happened to derive layout assertions for its fragment. The
 * owning test path, not any renderer's success/failure, declares that boundary. */
export function declaredWorkloadIntent(evidence: Partial<WorkloadEvidence> = {}, upstreamFiles: readonly string[] = []): Pick<UnifiedWorkload, 'intent' | 'intentReason'> {
  const expected = evidence.expected ?? {}, reference = evidence.reference ?? {}
  if (typeof expected.error === 'string' || expected.kind === 'error') return { intent: 'negative-admission', intentReason: 'Owning fixture explicitly expects source rejection' }
  if (evidence.parserOnly || expected.kind === 'parse' || upstreamFiles.length > 0 && upstreamFiles.every(file => /(?:\/parser\/|\.jison\.spec\.)/.test(file))) return { intent: 'parse-only', intentReason: 'Owning fixture asserts parser behavior, not renderability' }
  if (typeof evidence.assertions?.renderError === 'string' || evidence.diagnosticOnly && reference.ok !== false) return { intent: 'diagnostic', intentReason: 'Owning fixture explicitly declares a diagnostic/error observation' }
  return { intent: 'render', intentReason: 'Owning fixture declares a positive diagram/render workload' }
}

/** Unknown historical intent stays visible; it cannot earn a corrected positive
 * rendering score. The raw historical observations are never rewritten. */
export function positiveRenderInput(workload: UnifiedWorkload): boolean {
  return workload.intent === 'render' && workload.referenceAdmission?.accepted === true
}

export function workloadAppliesToOutput(workload: UnifiedWorkload, output: string): boolean {
  if (['parse', 'diagnostics', 'source'].includes(output)) return true
  return (workload.intent === undefined || workload.intent === 'render') && workload.referenceAdmission?.accepted !== false
}
