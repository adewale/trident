import { expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { crc32, deflateSync } from 'node:zlib'
import { verifyHarnessControlOutputs, verifyHarnessModelRows, verificationControls } from '../unified/harness-verification.ts'
import type { BenchmarkObservation } from '../unified/types.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp=useTempDirs('harness-controls-')
function png(value:number){
 const chunk=(type:string,data:Buffer)=>{const bytes=Buffer.alloc(data.length+12);bytes.writeUInt32BE(data.length);bytes.write(type,4);bytes.set(data,8);bytes.writeUInt32BE(crc32(bytes.subarray(4,-4)),bytes.length-4);return bytes}
 const header=Buffer.alloc(13);header.writeUInt32BE(2);header.writeUInt32BE(1,4);header[8]=8;header[9]=6
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from([0,value,0,0,255,255,255,255,255]))),chunk('IEND',Buffer.alloc(0))])
}
function rows(format:string,values:Uint8Array[]){const root=temp.dir();return verificationControls.filter(input=>input.intent!=='negative-admission').map((input,index)=>{const file=join(root,index+'.'+format);writeFileSync(file,values[index]!);return{suite:'fixture',surface:'actual-control',runtime:'fixture',family:'flowchart',caseId:input.id,operation:'render',format,mode:'unscored',status:'passed',metrics:{project:'fixture/renderer',outputFile:file}} as BenchmarkObservation})}
test('a static valid nonblank PNG cannot verify input propagation',()=>{
 const cached=png(0),changed=png(100)
 expect(verifyHarnessControlOutputs(rows('png',[cached,cached,cached]),'png','fixture/renderer').passed).toBe(false)
 expect(verifyHarnessControlOutputs(rows('png',[cached,changed,cached]),'png','fixture/renderer').passed).toBe(true)
})
test('a changed SVG must contain the new control label without retaining the stale one',()=>{
 const svg=(label:string)=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Alpha</text><text>'+label+'</text></svg>')
 const baseline=svg('Beta'),changed=svg('Gamma')
 expect(verifyHarnessControlOutputs(rows('svg',[baseline,changed,baseline]),'svg','fixture/renderer').passed).toBe(true)
 expect(verifyHarnessControlOutputs(rows('svg',[baseline,svg('Gamma Beta'),baseline]),'svg','fixture/renderer').passed).toBe(false)
})
test('one unrelated passing model row cannot satisfy the public model control',()=>{
 const control:BenchmarkObservation={suite:'fixture',surface:'native-public-api',runtime:'fixture',family:'flowchart',caseId:'meaning:family:flowchart:family',operation:'family',format:'structured',mode:'control',status:'passed',metrics:{project:'fixture/renderer',authoredCase:'meaning:family:flowchart',evidenceRecorded:true}}
 expect(verifyHarnessModelRows([control],'fixture/renderer')).toBe(false)
 const all=['native-admission','family','identities','node-labels','relationships'].map(operation=>({...control,operation}))
 expect(verifyHarnessModelRows(all,'fixture/renderer')).toBe(true)
 expect(verifyHarnessModelRows([...all,all[0]!],'fixture/renderer')).toBe(false)
 expect(verifyHarnessModelRows(all,'fixture/other')).toBe(false)
})
