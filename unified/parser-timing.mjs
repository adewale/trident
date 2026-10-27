/** Public-parser attempts only: DB projection and IPC stay outside these clocks. */
export async function samplePublicParser(parser, source, samples = 3) {
  if (!Number.isSafeInteger(samples) || samples < 1 || samples > 100) throw new Error('Invalid API benchmark samples')
  const attempt = async () => {
    try {
      const value = await parser(source)
      return value === false ? { ok: false, error: 'Public parser returned false' } : { ok: true }
    } catch (error) {
      return { ok: false, error: String(error?.message ?? error).slice(0, 3000) }
    }
  }
  const firstStart = performance.now()
  let result = await attempt()
  const firstMs = performance.now() - firstStart
  await attempt()
  const samplesMs = []
  for (let sample = 0; sample < samples; sample++) {
    const started = performance.now()
    result = await attempt()
    samplesMs.push(performance.now() - started)
  }
  return { ...result, timing: { firstMs, samplesMs, boundary: 'public mermaid.parse attempts, including rejected sources; DB projection and IPC excluded' } }
}
