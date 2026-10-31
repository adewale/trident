import { expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { beginDocsPngCapture, completeDocsPngCapture } from '../unified/docs-png-capture.ts'
const snapshot=()=>({fonts:[{path:'font',sha256:'a'.repeat(64),bytes:5}],configuration:[{path:'config',sha256:'b'.repeat(64),bytes:6}],variables:{LANG:'C'}})
test('optional capture freezes exact before/after inputs and covers only actual attempts entered during that execution',()=>{
 const root=mkdtempSync(join(tmpdir(),'trident-capture-'))
 try{
  writeFileSync(join(root,'context.json'),'{}');writeFileSync(join(root,'result.json'),'{}')
  const start=beginDocsPngCapture(root,['producer'],snapshot),before=readFileSync(join(start.directory,'before.json')),complete=completeDocsPngCapture(start,['actual-attempt'],snapshot)
  expect(complete.receipt).toMatchObject({status:'available',attemptIds:['actual-attempt']});expect(readFileSync(join(start.directory,'before.json'))).toEqual(before)
  const second=beginDocsPngCapture(root,['producer'],snapshot),later=completeDocsPngCapture(second,[],snapshot)
  expect(later.receipt.attemptIds).toEqual([]);expect(second.directory).not.toBe(start.directory)
 }finally{rmSync(root,{recursive:true,force:true})}
})
test('missing fontconfig or changed inputs withhold only the capture profile and preserve actual raw results',()=>{
 const root=mkdtempSync(join(tmpdir(),'trident-capture-'))
 try{
  writeFileSync(join(root,'context.json'),'{}');writeFileSync(join(root,'result.json'),'actual already retained raw result')
  const missing=beginDocsPngCapture(root,['producer'],()=>{throw Error('fontconfig absent')})
  expect(completeDocsPngCapture(missing,['actual-return'],snapshot).receipt.status).toBe('unavailable')
  const changed=beginDocsPngCapture(root,['producer'],snapshot)
  expect(completeDocsPngCapture(changed,['actual-return'],()=>({...snapshot(),variables:{LANG:'changed'}})).receipt.status).toBe('unavailable')
  expect(readFileSync(join(root,'result.json'),'utf8')).toBe('actual already retained raw result')
 }finally{rmSync(root,{recursive:true,force:true})}
})
