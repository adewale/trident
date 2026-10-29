/** Receipt evidence belongs to the selected public API, not a benchmark guess
 * based on accepted options or SVG bytes. A companion/fallback engine is still
 * part of the call and must not be advertised as strict native execution. */
export function layoutBackendCheck(receipt: unknown, backend: 'elk' | 'agentic') {
  const decisions = receipt && typeof receipt === 'object' ? (receipt as { layoutDecisions?: unknown }).layoutDecisions : undefined
  const passed = Array.isArray(decisions) && decisions.length > 0 && decisions.every(decision => decision && decision.requested === backend && decision.selected === backend && decision.fallback === 'none' && Array.isArray(decision.attempts) && decision.attempts.length === 1 && decision.attempts[0]?.backend === backend && decision.attempts[0]?.outcome === 'selected' && typeof decision.implementation === 'string' && decision.implementation.length > 0)
  return { name: 'layout-backend-selection', status: passed ? 'passed' : 'failed', expected: { backend, fallback: 'none' }, actual: decisions ?? null, scope: 'Every consumed public receipt layout decision selects the requested backend with no fallback or companion backend substitution. This checks declared producer evidence, not an independent algorithm trace.' }
}
