import { expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { beginDocsPngCapture, completeDocsPngCapture } from '../unified/docs-png-capture.ts'
const snapshot=()=>({fonts:[{path:'font',sha256:'a'.repeat(64),bytes:5}],configuration:[{path:'config',sha256:'b'.repeat(64),bytes:6}],variables:{LANG:'C'}})
test('optional capture freezes exact before/after inputs and covers only actual attempts entered during that execution',()=>{
 const root=mkdtempSync(join(tmpdir(),'trident-capture-'))
 try{
  writeFileSync(join(root,'context.json'),'{}');writeFileSync(join(root,'result.json'),'{}')
  const start=beginDocsPngCapture(root,['producer'],snapshot),before=readFileSync(join(start.directory,'before.json'))
  const journal=new InvocationJournal(join(root,'invocations')),entered=journal.start({project:'synthetic/control',caseId:'control',sourceSha256:'a'.repeat(64),artifactSha256:'b'.repeat(64),bindingSha256:'c'.repeat(64),format:'png'});journal.returned(entered,Buffer.from('actual return'),1)
  const complete=completeDocsPngCapture(start,[entered.attemptId],snapshot)
  expect(complete.receipt).toMatchObject({status:'available',attemptIds:[entered.attemptId]});expect(readFileSync(join(start.directory,'before.json'))).toEqual(before)
  const second=beginDocsPngCapture(root,['producer'],snapshot),later=completeDocsPngCapture(second,[],snapshot)
  expect(later.receipt.attemptIds).toEqual([]);expect(second.directory).not.toBe(start.directory)
  const retrospective=beginDocsPngCapture(root,['producer'],snapshot),rejected=completeDocsPngCapture(retrospective,[entered.attemptId],snapshot);expect(rejected.receipt.status).toBe('unavailable');expect(rejected.receipt.reason).toContain('already present')
  const invented=beginDocsPngCapture(root,['producer'],snapshot);expect(completeDocsPngCapture(invented,['invented-no-start'],snapshot).receipt.status).toBe('unavailable')
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
