import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { importOfflinePngReviews,readLegacyPngDirectBasisAudit, type OfflinePngReviewReceipt } from './docs-png-offline-review.ts'

const decode = (file: string) => { const bytes = readFileSync(file); return (file.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString() }
const owned = (root: string, file: string) => { const path = resolve(root,file), suffix=relative(realpathSync(root),realpathSync(path)); if(isAbsolute(suffix)||suffix==='..'||suffix.startsWith('../'))throw Error('Selected PNG evidence escapes its declared root');return path }
export interface SelectedPngReviewOrigin { origin: { file: string; line: number; directory: string }; /** SHA256 of the untouched original JSONL line, excluding its newline. */ receiptSha256: string; receipt: OfflinePngReviewReceipt }

/** Materialize explicitly selected, unchanged receipts from a heterogeneous
 * retained corpus. Origin checks and per-file packet roots survive selection.
 * A restored archive can map old provenance paths without rewriting receipts.
 * No image judgment, source-contract upgrade, renderer or API call occurs. */
export function materializeSelectedPngReviews(options: { inventoryFile: string; contractsFile: string; originsFile: string; imageRoots: readonly string[]; out: string; pathMapFile?: string; legacyBasisFile?: string }) {
  if(!options.imageRoots.length||existsSync(options.out)||existsSync(options.out+'.receipt.json'))throw Error('Selected PNG import needs image roots and fresh output files')
  const map = options.pathMapFile ? JSON.parse(decode(options.pathMapFile)) : null
  if(map && (map.schema!=='trident-png-restored-path-map-v1'||!map.paths))throw Error('Invalid restored PNG evidence path map')
  const locate = (path:string) => { if(!map)return resolve(path);let logical=map.paths[resolve(path)];const mapRoot=dirname(resolve(options.pathMapFile!));if(typeof logical!=='string'){const local=relative(mapRoot,resolve(path));if(Object.values(map.paths).includes(local))logical=local;else throw Error('Restored PNG evidence has no exact provenance path mapping: '+path)}return owned(mapRoot,logical) }
  const inventory=JSON.parse(decode(locate(options.inventoryFile))),contracts=JSON.parse(decode(locate(options.contractsFile))),selected=decode(locate(options.originsFile)).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line)) as SelectedPngReviewOrigin[]
  const originByReceipt=new Map<OfflinePngReviewReceipt,SelectedPngReviewOrigin>(),lineCache=new Map<string,string[]>()
  for(const row of selected){
    if(!row.origin?.file||!Number.isSafeInteger(row.origin.line)||row.origin.line<1||resolve(row.origin.directory)!==dirname(resolve(row.origin.file))||!/^[a-f0-9]{64}$/.test(row.receiptSha256))throw Error('Selected PNG origin or exact receipt identity differs')
    const file=locate(row.origin.file);if(!lineCache.has(file))lineCache.set(file,decode(file).split('\n').filter(Boolean));const original=lineCache.get(file)![row.origin.line-1]
    if(!original||evidenceBytesDigest(original)!==row.receiptSha256||evidenceDigest(JSON.parse(original))!==evidenceDigest(row.receipt))throw Error('Selected PNG receipt differs from its untouched original file/line')
    originByReceipt.set(row.receipt,row)
  }
  const legacyReviewBasis=options.legacyBasisFile?readLegacyPngDirectBasisAudit(locate(options.legacyBasisFile)):undefined
  const images=new Map<string,string>()
  const imported=importOfflinePngReviews(inventory.cases,contracts,selected.map(row=>row.receipt),receipt=>{
    if(!images.has(receipt.review.pngSha256)){
      const candidates=options.imageRoots.flatMap(root=>{try{const suffix='drawings/'+receipt.review.pngSha256+'.png';return[map?locate(join(root,suffix)):owned(root,suffix)]}catch{return[]}}).filter(existsSync)
      if(!candidates.length)throw Error('Selected PNG has no original bytes in a declared image root: '+receipt.review.id)
      for(const file of candidates)if(evidenceBytesDigest(readFileSync(file))!==receipt.review.pngSha256)throw Error('Selected PNG content-addressed original bytes changed')
      images.set(receipt.review.pngSha256,candidates[0]!)
    }
    return readFileSync(images.get(receipt.review.pngSha256)!)
  },receipt=>{
    const origin=originByReceipt.get(receipt)!,originalPacket=resolve(origin.origin.directory,receipt.inspection.packet),suffix=relative(resolve(origin.origin.directory),originalPacket)
    if(isAbsolute(suffix)||suffix==='..'||suffix.startsWith('../'))throw Error('Selected inspection packet escapes its original evidence directory')
    return readFileSync(map?locate(originalPacket):owned(origin.origin.directory,receipt.inspection.packet))
  },legacyReviewBasis)
  mkdirSync(dirname(resolve(options.out)),{recursive:true});writeFileSync(options.out,JSON.stringify(imported.reviews)+'\n',{flag:'wx'})
  const receipt={schema:'trident-selected-png-review-import-v1',reviews:imported.reviews.length,inspections:imported.imported.length,inventorySha256:evidenceBytesDigest(readFileSync(locate(options.inventoryFile))),contractsSha256:evidenceBytesDigest(readFileSync(locate(options.contractsFile))),originsSha256:evidenceBytesDigest(readFileSync(locate(options.originsFile))),reviewFileSha256:evidenceBytesDigest(readFileSync(options.out)),imported:imported.imported,rendererInvocations:0,codexApiInvocations:0,...(legacyReviewBasis?{legacyDirectBasis:{path:options.legacyBasisFile,fileSha256:evidenceBytesDigest(readFileSync(locate(options.legacyBasisFile!))),auditSha256:evidenceDigest(legacyReviewBasis)}}:{}),...(options.pathMapFile?{pathMapSha256:evidenceBytesDigest(readFileSync(options.pathMapFile))}:{})}
  writeFileSync(options.out+'.receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});return{out:options.out,reviews:receipt.reviews,inspections:receipt.inspections,rendererInvocations:0,codexApiInvocations:0}
}
if(import.meta.main){
 const args=process.argv.slice(2),values=new Map<string,string>(),imageRoots:string[]=[]
 if(args.includes('--help'))console.log('bun unified/import-png-review-selection.ts --inventory FILE --contracts FILE --origins FILE --image-root PNG_ROOT [--image-root PNG_ROOT ...] --out FRESH_JSON [--path-map RESTORED_MAP] [--legacy-basis AUDIT_FILE]\nVerifies exact unchanged selected review origins and their own packet directories; no renderer, Codex or API needed.')
 else{for(let i=0;i<args.length;i+=2){const key=args[i]!,value=args[i+1];if(!['--inventory','--contracts','--origins','--image-root','--out','--path-map','--legacy-basis'].includes(key)||!value||key!=='--image-root'&&values.has(key))throw Error('Use --help');if(key==='--image-root')imageRoots.push(value);else values.set(key,value)}for(const key of ['--inventory','--contracts','--origins','--out'])if(!values.has(key))throw Error('Use --help');console.log(JSON.stringify(materializeSelectedPngReviews({inventoryFile:values.get('--inventory')!,contractsFile:values.get('--contracts')!,originsFile:values.get('--origins')!,out:values.get('--out')!,imageRoots,pathMapFile:values.get('--path-map'),legacyBasisFile:values.get('--legacy-basis')})))}
}
