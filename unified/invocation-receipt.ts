/** Admission of a fully consumed public receipt, independent of renderer internals. */
export function assertInvocationReceipt(receipt: unknown, output: string): void {
  if (!receipt || typeof receipt !== 'object') throw new Error('Receipt-bearing invocation returned no receipt')
  const value = receipt as Record<string, unknown>
  if (!Number.isInteger(value.version) || (value.version as number) < 1) throw new Error('Receipt has no supported integer version')
  if (value.output !== output) throw new Error(`Receipt output ${String(value.output)} does not match ${output}`)
  if (typeof value.requestDigest !== 'string' || !value.requestDigest) throw new Error('Receipt has no requestDigest')
  if ((value.version as number) >= 2) {
    for (const name of ['sharedRequestDigest', 'appearanceDigest']) if (typeof value[name] !== 'string' || !value[name]) throw new Error(`Receipt has no ${name}`)
    const decision = value.capabilityDecision as Record<string, unknown> | undefined
    if (!decision || typeof decision.accepted !== 'boolean' || !Array.isArray(decision.resolutions)) throw new Error('Receipt has no materialized capability decision')
  }
}

/** Public JSON transport admission; painted coverage and geometry correspondence
 * remain the responsibility of independent fidelity oracles. */
export function assertResolvedSceneEnvelope(value: unknown): void {
  const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
  const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
  const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value
  const oneOf = (value: unknown, choices: readonly string[]) => typeof value === 'string' && choices.includes(value)
  const primitive = (value: unknown): void => {
    if (!record(value) || !oneOf(value.kind, ['path', 'text'])) throw Error('Resolved Scene has an unsupported public primitive')
    if (!Array.isArray(value.matrix) || value.matrix.length !== 6 || !Array.from(value.matrix).every(finite)) throw Error('Resolved Scene primitive has no finite affine matrix')
    const paint = value.paint
    if (!record(paint) || !['fill', 'stroke', 'paintOrder'].every(key => typeof paint[key] === 'string')
      || !['fillOpacity', 'strokeOpacity', 'strokeWidth', 'opacity', 'miterLimit'].every(key => finite(paint[key]))
      || !oneOf(paint.lineCap, ['butt', 'round', 'square']) || !oneOf(paint.lineJoin, ['miter', 'round', 'bevel', 'arcs', 'miter-clip'])
      || !oneOf(paint.fillRule, ['nonzero', 'evenodd'])
      || paint.dashArray !== undefined && (!Array.isArray(paint.dashArray) || !Array.from(paint.dashArray).every(finite))
      || paint.dashOffset !== undefined && !finite(paint.dashOffset)) throw Error('Resolved Scene primitive has malformed consumed paint')
    if (value.kind === 'path') {
      if (typeof value.d !== 'string' || value.marker !== undefined && value.marker !== true) throw Error('Resolved Scene has a malformed public path')
      return
    }
    if (typeof value.text !== 'string' || !['x', 'y', 'fontSize', 'fontWeight'].every(key => finite(value[key]))
      || !Array.isArray(value.fontFamily) || !Array.from(value.fontFamily).every(nonempty)
      || !oneOf(value.fontStyle, ['normal', 'italic', 'oblique']) || !oneOf(value.anchor, ['start', 'middle', 'end'])
      || value.baseline !== undefined && typeof value.baseline !== 'string'
      || value.lengthAdjust !== undefined && !oneOf(value.lengthAdjust, ['spacing', 'spacingAndGlyphs'])
      || ['textLength', 'letterSpacing'].some(key => value[key] !== undefined && !finite(value[key]))) throw Error('Resolved Scene has malformed public text geometry')
  }
  if (!record(value) || value.version !== 1 || !nonempty(value.family) || typeof value.svg !== 'string') throw Error('Resolved Scene has no supported version/family/SVG envelope')
  if (![value.width, value.height].every(number => finite(number) && number >= 0)) throw Error('Resolved Scene has no finite nonnegative canvas')
  if (!Array.isArray(value.parts) || !Array.isArray(value.frame) || !record(value.colors)
    || !nonempty(value.colors.bg) || !nonempty(value.colors.fg)) throw Error('Resolved Scene has no consumed parts/frame/colors')
  for (const part of value.parts) {
    if (!record(part) || !nonempty(part.id) || !nonempty(part.role) || !nonempty(part.kind) || !record(part.node)
      || part.node.id !== part.id || part.node.role !== part.role || part.node.kind !== part.kind
      || !Array.isArray(part.primitives)) throw Error('Resolved Scene has malformed public part identities')
    for (const item of part.primitives) primitive(item)
  }
  for (const item of value.frame) primitive(item)
}
