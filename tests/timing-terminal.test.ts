import {expect,test} from 'bun:test'
import {once} from 'node:events'
import {Worker} from 'node:worker_threads'
import {writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {useTempDirs} from './helpers/temp-dir.ts'
import {evidenceBytesDigest} from '../portable/evidence-contract.ts'
const temp=useTempDirs('terminal-cold-cli-')
async function call(script:string,source:string,timeoutMs=1000){
 const root=temp.dir(),file=join(root,'cli.js');writeFileSync(file,script)
 const worker=new Worker(new URL('../unified/terminal-cli-timing-worker.ts',import.meta.url),{workerData:{executable:process.execPath,args:[file],environment:{NO_COLOR:'1',TERM:'dumb'},timeoutMs}}), events:any[]=[]
 worker.on('message',value=>events.push(value));const[ready]=await once(worker,'message');expect(ready.schema).toBe('trident-qualified-timing-ready-v1')
 const returned=new Promise<any>(resolve=>worker.on('message',value=>{if(value?.schema==='trident-qualified-timing-return-v1'||value?.schema==='trident-qualified-timing-error-v1')resolve(value)}))
 worker.postMessage({schema:'trident-qualified-timing-call-v1',attemptId:'synthetic-transport',source});const result=await returned;await worker.terminate();return{result,events}
}
test('cold public CLI worker starts one real process and returns complete original Unicode bytes',async()=>{
 const r=await call(`let s='';for await(const c of process.stdin)s+=c;process.stdout.write('開始 '+s);process.stdout.write(' 終了 🎉');`,'actual stdin')
 expect(new TextDecoder().decode(r.result.output)).toBe('開始 actual stdin 終了 🎉')
 const streams=r.events.filter(e=>e.schema==='trident-terminal-cli-streams-v1');expect(streams).toHaveLength(1)
 expect(streams[0]).toMatchObject({status:0,sourceSha256:evidenceBytesDigest('actual stdin'),stdoutSha256:evidenceBytesDigest(r.result.output),stderrBase64:''})
})
test('actual CLI failure preserves stderr and cannot become a successful return',async()=>{
 const r=await call(`process.stdout.write('partial');process.stderr.write('specific public error');process.exit(3);`,'source')
 expect(r.result.schema).toBe('trident-qualified-timing-error-v1')
 const stream=r.events.find(e=>e.schema==='trident-terminal-cli-streams-v1');expect(stream.status).toBe(3);expect(Buffer.from(stream.stderrBase64,'base64').toString()).toBe('specific public error')
 expect(JSON.parse(r.result.detail.replace(/^Error: /,''))).toMatchObject({status:3,stdoutBase64:Buffer.from('partial').toString('base64')})
})
test('a blocked CLI is killed within the binding timeout and retains an error outcome',async()=>{
 const r=await call(`setTimeout(()=>process.stdout.write('late'),10000);`,'source',100)
 expect(r.result.schema).toBe('trident-qualified-timing-error-v1')
 const stream=r.events.find(e=>e.schema==='trident-terminal-cli-streams-v1');expect(stream.error).toBeTruthy();expect(stream.status).not.toBe(0)
 expect(()=>process.kill(stream.pid,0)).toThrow()
})

test('a CLI that ignores SIGTERM cannot escape its owned process deadline',async()=>{
 const start=performance.now(),r=await call(`process.on('SIGTERM',()=>{});setTimeout(()=>process.stdout.write('late'),5000);`,'source',200)
 expect(performance.now()-start).toBeLessThan(4000)
 expect(r.result.schema).toBe('trident-qualified-timing-error-v1')
 const stream=r.events.find(e=>e.schema==='trident-terminal-cli-streams-v1');expect(stream.signal).toBe('SIGKILL');expect(stream.status).not.toBe(0)
 expect(()=>process.kill(stream.pid,0)).toThrow()
})
