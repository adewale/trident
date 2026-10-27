import { spawn } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'
const marker = '\u0001entry-startup\u0001'
export interface FreshChildResult { code: number | null; stdout: string; stderr: string; wallMs: number; phases: { phase: string; observedMs: number; [key: string]: unknown }[] }
/** Stop each phase on receipt of a complete frame. UTF8 decoding is streaming;
 * arbitrary stdout chunk boundaries cannot truncate multibyte results. */
export async function runStartupChild(command: string, args: string[], options: { cwd: string; input?: string; timeoutMs?: number }): Promise<FreshChildResult> {
  return await new Promise((resolveResult, reject) => {
    const started = performance.now(), phases: FreshChildResult['phases'] = [], decoder = new StringDecoder('utf8')
    const child = spawn(command, args, { cwd: options.cwd, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, LC_ALL: 'C' } })
    let stdout = '', stderr = '', pending = '', aborted = false
    const kill = () => { try { if (child.pid && process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL'); else child.kill('SIGKILL') } catch {} }
    const timer = setTimeout(() => { aborted = true; kill() }, options.timeoutMs ?? 60_000)
    const accept = (text: string) => {
      stdout += text; pending += text
      let newline: number
      while ((newline = pending.indexOf('\n')) >= 0) {
        const line = pending.slice(0, newline); pending = pending.slice(newline + 1)
        if (line.startsWith(marker)) { try { phases.push({ ...JSON.parse(line.slice(marker.length)), observedMs: performance.now() - started }) } catch { /* malformed frames are rejected by the caller */ } }
      }
    }
    child.stdout!.on('data', chunk => accept(decoder.write(chunk)))
    child.stderr!.on('data', chunk => { stderr += chunk.toString(); if (stderr.length > 100_000) stderr = stderr.slice(-100_000) })
    child.once('error', error => { clearTimeout(timer); kill(); reject(error) })
    child.once('close', code => { clearTimeout(timer); accept(decoder.end()); resolveResult({ code: aborted ? 124 : code, stdout, stderr, wallMs: performance.now() - started, phases }) })
    child.stdin!.on('error', () => {})
    child.stdin!.end(options.input)
  })
}
export function parseStartupResource(text: string): { userCpuMs: number; systemCpuMs: number; peakRssBytes: number; cpuResolutionMs: number } {
  const field = (name: string) => { const value = new RegExp(`^${name}=([0-9]+(?:\\.[0-9]+)?)$`, 'm').exec(text)?.[1]; if (value === undefined) throw Error(`Missing GNU time field: ${name}`); return Number(value) }
  return { userCpuMs: field('user_seconds') * 1000, systemCpuMs: field('system_seconds') * 1000, peakRssBytes: field('peak_rss_kib') * 1024, cpuResolutionMs: 10 }
}
