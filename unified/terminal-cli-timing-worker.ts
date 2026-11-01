import { spawnSync } from 'node:child_process'
import { parentPort, workerData } from 'node:worker_threads'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { serveQualifiedTimingWorker } from '../portable/qualified-timing-collection.ts'
const binding = workerData as { executable: string; args: string[]; environment: Record<string, string>; timeoutMs: number }
if (!binding?.executable || !Array.isArray(binding.args) || !Number.isSafeInteger(binding.timeoutMs) || binding.timeoutMs < 1 || binding.timeoutMs > 10_000) throw Error('Frozen terminal CLI binding is invalid')
serveQualifiedTimingWorker(source => {
  // The public command starts only inside the collector-owned request clock.
  // No module API, warm renderer, label admission or cached return is used.
  const child = spawnSync(binding.executable, binding.args, { input: Buffer.from(source, 'utf8'), timeout: binding.timeoutMs, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, ...binding.environment } })
  const stdout = child.stdout ?? Buffer.alloc(0), stderr = child.stderr ?? Buffer.alloc(0)
  parentPort!.postMessage({ schema: 'trident-terminal-cli-streams-v1', sourceSha256: evidenceBytesDigest(source), stdoutSha256: evidenceBytesDigest(stdout), stdoutBytes: stdout.length, stderrBase64: stderr.toString('base64'), stderrSha256: evidenceBytesDigest(stderr), pid: child.pid, status: child.status, signal: child.signal, error: child.error?.message ?? null })
  if (child.error || child.status !== 0) throw Error(JSON.stringify({ boundary: 'public CLI process', status: child.status, signal: child.signal, error: child.error?.message ?? null, stdoutBase64: stdout.toString('base64'), stderrBase64: stderr.toString('base64') }))
  return new Uint8Array(stdout)
})
