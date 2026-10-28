import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { assertBenchmarkToolVersion } from '../tool-versions.ts'
import { communityCatalogFile } from './trident-paths.ts'
import type { UnifiedRunOptions } from './types.ts'
const readJson = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))

/** Every selected artifact must be the benchmark set's pinned version before acquisition. */
export function admitSelectedArtifacts(options: Partial<UnifiedRunOptions>): void {
  const selected = (project: string) => !options.communityProjects || options.communityProjects.includes(project)
  if (options.portableArtifactRoot) {
    const manifest = join(options.portableArtifactRoot, 'package.json')
    if (existsSync(manifest)) {
      const pkg = readJson(manifest)
      const project = options.portableProject ?? (pkg.name === 'pele' ? 'obsidianmd/pele' : pkg.name)
      if (selected(project)) assertBenchmarkToolVersion(project, pkg.version, manifest)
    }
  }
  const catalog = options.communityCatalogFile ?? communityCatalogFile
  if (existsSync(catalog)) for (const node of readJson(catalog).nodes ?? []) {
    if (node.id === 'obsidianmd/pele' && selected(node.id)) assertBenchmarkToolVersion(node.id, node.benchmark?.version ?? '', `${catalog} explicit acquisition pin`)
  }
  if (options.communityArtifacts && existsSync(options.communityArtifacts)) for (const [project, artifact] of Object.entries(readJson(options.communityArtifacts)) as [string, { version?: string }][]) {
    if (selected(project)) assertBenchmarkToolVersion(project, artifact.version ?? '', options.communityArtifacts)
  }
  if (options.communityPreparedFile && existsSync(options.communityPreparedFile)) for (const entry of readJson(options.communityPreparedFile)) {
    if (entry.artifact && selected(entry.node.id)) assertBenchmarkToolVersion(entry.node.id, entry.artifact.version ?? '', options.communityPreparedFile)
  }
}

