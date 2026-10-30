import { resolve } from 'node:path'
import { harnessRepository } from './trident-paths.ts'
import { admitSelectedArtifacts } from './artifact-admission.ts'
import type { UnifiedRunOptions } from './types.ts'
import { FULL_SAMPLING } from '../portable/protocol.ts'

/** Public-artifact settings only. Product release/editor/provider options live
 * in the product repository and are not accepted as community benchmark flags. */
export function parseOptions(argv: string[]): UnifiedRunOptions & { allowIncomplete: boolean } {
  const flags = new Set(['--community-force', '--allow-incomplete'])
  const paths: Record<string, keyof UnifiedRunOptions> = {
    out: 'out', executable: 'executable', 'node-executable': 'nodeExecutable',
    'community-artifacts': 'communityArtifacts', 'community-catalog': 'communityCatalogFile',
    'community-records': 'communityRecordStore', 'community-prepared': 'communityPreparedFile',
    'community-inputs': 'communityInputsFile', 'community-browser-prepared': 'communityBrowserPreparedFile',
    'community-qualification-assets': 'communityQualificationAssetDir',
  }
  const values = new Map<string, string>()
  const allowed = new Set([...Object.keys(paths), 'profile', 'rounds', 'community-projects', 'projects', 'community-artifact-policy', 'community-coverage', 'community-outputs', 'community-qualification-protocol'])
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]!, key = flag.slice(2)
    if (values.has(key)) throw Error('Duplicate option ' + flag)
    if (flags.has(flag)) { values.set(key, 'true'); continue }
    const value = argv[++index]
    if (!flag.startsWith('--') || !allowed.has(key) || !value || value.startsWith('--')) throw Error('Invalid option ' + flag + '; use --help')
    values.set(key, value)
  }
  const profile = values.get('profile') ?? 'smoke'
  if (profile !== 'smoke' && profile !== 'full') throw Error('--profile must be smoke or full')
  const rounds = Number(values.get('rounds') ?? (profile === 'full' ? FULL_SAMPLING.rounds : 1))
  if (!Number.isSafeInteger(rounds) || rounds < 1) throw Error('--rounds must be a positive integer')
  if (values.has('projects') && values.has('community-projects')) throw Error('Use --projects or --community-projects, not both')
  const communityProjects = (values.get('projects') ?? values.get('community-projects'))?.split(',')
  if (communityProjects && (communityProjects.some(value => !value) || new Set(communityProjects).size !== communityProjects.length)) throw Error('--projects needs unique nonempty project IDs')
  const policy = values.get('community-artifact-policy') ?? 'latest', coverage = values.get('community-coverage') ?? 'once'
  if (!['frozen', 'latest'].includes(policy) || !['once', 'repeated'].includes(coverage)) throw Error('Invalid community artifact or coverage policy')
  const options: UnifiedRunOptions & { allowIncomplete: boolean } = {
    root: harnessRepository, harnessRoot: harnessRepository, out: resolve('bench-report/community'), profile, rounds,
    communityProjects, communityForce: values.has('community-force'), allowIncomplete: values.has('allow-incomplete'),
    communityArtifactPolicy: policy as 'latest' | 'frozen', communityCoverageOnce: coverage === 'once',
    communityOutputs: values.get('community-outputs')?.split(','), communityQualificationProtocol: values.get('community-qualification-protocol'),
  }
  for (const [flag, property] of Object.entries(paths)) if (values.has(flag)) Object.assign(options, { [property]: resolve(values.get(flag)!) })
  admitSelectedArtifacts(options)
  return options
}
