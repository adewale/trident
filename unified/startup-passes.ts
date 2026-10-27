export type StartupPasses = 'all' | 'latency' | 'resources'

export function startupPasses(value: string | undefined): StartupPasses {
  if (value === undefined) return 'all'
  if (value === 'all' || value === 'latency' || value === 'resources') return value
  throw Error('--startup-passes needs all, latency or resources')
}
/** One independent resource checkpoint per round; latency keeps its requested
 * samples. A resource-only request must never manufacture a latency attempt. */
export function startupPassFlags(passes: StartupPasses, sample: number): boolean[] {
  if (passes === 'resources') return sample === 1 ? [true] : []
  if (passes === 'latency') return [false]
  return sample === 1 ? [false, true] : [false]
}
