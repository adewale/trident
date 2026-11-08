export type FidelityEnvironment = 'node' | 'jsdom'
export interface EnvironmentReceipt { protocol: 'fidelity-environment-v1'; file: string; environment: FidelityEnvironment; window: string; document: string }

/** Run before production imports: an ignored runner option must fail visibly,
 * rather than qualify JSDOM observations as evidence of DOM-free execution. */
export function attestEnvironment(file: string, expected: FidelityEnvironment, globals: { window: string; document: string }): EnvironmentReceipt {
  const required = expected === 'node' ? 'undefined' : 'object'
  if (!['node', 'jsdom'].includes(expected) || globals.window !== required || globals.document !== required) throw Error(`TRIDENT_RUNNER_ENVIRONMENT: ${file}: expected ${expected}; window=${globals.window}, document=${globals.document}`)
  return { protocol: 'fidelity-environment-v1', file, environment: expected, ...globals }
}

export function environmentSummary(files: readonly { absolute: string; environment?: string }[], receipts: readonly EnvironmentReceipt[], control = false) {
  const selected = new Map(files.map(file => [file.absolute, control ? 'jsdom' : file.environment ?? 'jsdom'])), seen = new Set<string>()
  const counts = { node: 0, jsdom: 0, unobserved: files.length }
  for (const receipt of receipts) {
    if (receipt.protocol !== 'fidelity-environment-v1' || !selected.has(receipt.file) || seen.has(receipt.file) || selected.get(receipt.file) !== receipt.environment) throw Error('Invalid, duplicate or outside-plan Fidelity environment receipt: ' + receipt.file)
    attestEnvironment(receipt.file, receipt.environment, receipt)
    seen.add(receipt.file); counts[receipt.environment]++; counts.unobserved--
  }
  return counts
}
