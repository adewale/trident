import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { importOfflinePngReviews, type OfflinePngReviewReceipt } from './docs-png-offline-review.ts'
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
export function materializeOfflinePngReviews(options: { campaign: string; receipts: readonly string[]; out: string; contracts?: string }) {
  const campaign = resolve(options.campaign), out = resolve(options.out)
  if (existsSync(out) || existsSync(out + '.receipt.json')) throw Error('Offline PNG review output and receipt must be fresh files')
  const inputs = JSON.parse(read(join(campaign, 'docs/inventory.json'))).cases
  const contractsFile = options.contracts ?? join(tridentDirectory, 'corpus/docs-reviewed.json'), contracts = JSON.parse(read(contractsFile))
  const imported = options.receipts.map(file => {
    const receipts = read(file).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) as OfflinePngReviewReceipt[]
    return importOfflinePngReviews(inputs, contracts, receipts,
      receipt => readFileSync(own(join(campaign, 'docs/png'), 'drawings/' + receipt.review.pngSha256 + '.png')),
      receipt => readFileSync(own(dirname(resolve(file)), receipt.inspection.packet)))
  })
  const reviews = imported.flatMap(result => result.reviews)
  const keys = reviews.map(review => JSON.stringify([review.id, review.pngSha256]))
  if (new Set(keys).size !== keys.length) throw Error('Separate offline review files duplicate the same image/source judgment')
  mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(reviews) + '\n', { flag: 'wx' })
  const receipt = { schema: 'trident-offline-png-review-import-v1', contractsSha256: evidenceBytesDigest(readFileSync(contractsFile)), reviewFileSha256: evidenceBytesDigest(readFileSync(out)), imported: imported.flatMap(result => result.imported), rendererInvocations: 0, codexApiInvocations: 0, reviewSources: options.receipts.map(file => ({ path: resolve(file), sha256: evidenceBytesDigest(readFileSync(file)) })) }
  writeFileSync(out + '.receipt.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' })
  return { out, reviews: reviews.length, inspections: receipt.imported.length, rendererInvocations: 0, codexApiInvocations: 0 }
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  if (args.includes('--help')) console.log('bun unified/import-png-reviews.ts --campaign DIR --receipts FILE [--receipts FILE ...] --out FRESH_JSON [--contracts FILE]\nImports independently authored source/image inspection receipts and preserves reviewed originals for exact decoded-pixel replay. No renderer or Codex/API is called.')
  else {
    const receipts: string[] = [], values = new Map<string, string>()
    for (let index = 0; index < args.length; index += 2) {
      const key = args[index]!, value = args[index + 1]
      if (!['--campaign', '--receipts', '--out', '--contracts'].includes(key) || !value || key !== '--receipts' && values.has(key)) throw Error('Use --help')
      if (key === '--receipts') receipts.push(value); else values.set(key, value)
    }
    if (!values.has('--campaign') || !values.has('--out') || !receipts.length) throw Error('Use --help')
    console.log(JSON.stringify(materializeOfflinePngReviews({ campaign: values.get('--campaign')!, receipts, out: values.get('--out')!, contracts: values.get('--contracts') })))
  }
}
