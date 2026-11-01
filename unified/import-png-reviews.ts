import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { evidenceBytesDigest,evidenceDigest } from '../portable/evidence-contract.ts'
import { importOfflinePngReviews,readLegacyPngDirectBasisAudit, type OfflinePngReviewReceipt } from './docs-png-offline-review.ts'
import { tridentDirectory } from './trident-paths.ts'

const own = (root: string, name: string) => {
  const path = resolve(root, name), suffix = relative(realpathSync(root), realpathSync(path))
  if (isAbsolute(suffix) || suffix === '..' || suffix.startsWith('../')) throw Error('Offline PNG review witness escapes its evidence bundle')
  return path
}
const read = (file: string) => {
  const bytes = readFileSync(file)
  return (file.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8')
}

/** Offline import only: no project renderer, browser or Codex/API invocation. */
export function materializeOfflinePngReviews(options: { campaign: string; receipts: readonly string[]; out: string; contracts?: string; legacyBasisFile?: string }) {
  const campaign = resolve(options.campaign), out = resolve(options.out)
  if (existsSync(out) || existsSync(out + '.receipt.json')) throw Error('Offline PNG review output and receipt must be fresh files')
  const inputs = JSON.parse(read(join(campaign, 'docs/inventory.json'))).cases
  const contractsFile = options.contracts ?? join(tridentDirectory, 'corpus/docs-reviewed.json'), contracts = JSON.parse(read(contractsFile))
  const legacyReviewBasis=options.legacyBasisFile?readLegacyPngDirectBasisAudit(options.legacyBasisFile):undefined
  const origins = new Map<OfflinePngReviewReceipt, string>(), receipts = options.receipts.flatMap(file => {
    const rows = read(file).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) as OfflinePngReviewReceipt[]
    for (const row of rows) origins.set(row, dirname(resolve(file)))
    return rows
  })
  // Import together so identical actual bytes independently returned by two
  // projects retain both receipts even when authored in separate review files.
  // Contradictory verdicts for the same source/image still throw in the importer.
  const imported = importOfflinePngReviews(inputs, contracts, receipts,
    receipt => readFileSync(own(join(campaign, 'docs/png'), 'drawings/' + receipt.review.pngSha256 + '.png')),
    receipt => readFileSync(own(origins.get(receipt)!, receipt.inspection.packet)),legacyReviewBasis)
  const reviews = imported.reviews
  mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(reviews) + '\n', { flag: 'wx' })
  const receipt = { schema: 'trident-offline-png-review-import-v1', contractsSha256: evidenceBytesDigest(readFileSync(contractsFile)), reviewFileSha256: evidenceBytesDigest(readFileSync(out)), imported: imported.imported, rendererInvocations: 0, codexApiInvocations: 0, ...(legacyReviewBasis?{legacyDirectBasis:{path:resolve(options.legacyBasisFile!),fileSha256:evidenceBytesDigest(readFileSync(options.legacyBasisFile!)),auditSha256:evidenceDigest(legacyReviewBasis)}}:{}), reviewSources: options.receipts.map(file => ({ path: resolve(file), sha256: evidenceBytesDigest(readFileSync(file)) })) }
  writeFileSync(out + '.receipt.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' })
  return { out, reviews: reviews.length, inspections: receipt.imported.length, rendererInvocations: 0, codexApiInvocations: 0 }
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  if (args.includes('--help')) console.log('bun unified/import-png-reviews.ts --campaign DIR --receipts FILE [--receipts FILE ...] --out FRESH_JSON [--contracts FILE] [--legacy-basis AUDIT_FILE]\nImports independently authored source/image inspection receipts and preserves reviewed originals for exact decoded-pixel replay. No renderer or Codex/API is called.')
  else {
    const receipts: string[] = [], values = new Map<string, string>()
    for (let index = 0; index < args.length; index += 2) {
      const key = args[index]!, value = args[index + 1]
      if (!['--campaign', '--receipts', '--out', '--contracts','--legacy-basis'].includes(key) || !value || key !== '--receipts' && values.has(key)) throw Error('Use --help')
      if (key === '--receipts') receipts.push(value); else values.set(key, value)
    }
    if (!values.has('--campaign') || !values.has('--out') || !receipts.length) throw Error('Use --help')
    console.log(JSON.stringify(materializeOfflinePngReviews({ campaign: values.get('--campaign')!, receipts, out: values.get('--out')!, contracts: values.get('--contracts'), legacyBasisFile:values.get('--legacy-basis') })))
  }
}
