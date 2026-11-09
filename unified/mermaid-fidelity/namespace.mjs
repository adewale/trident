/** Loader reflection is not a candidate observation. Keep unknown exports
 * deferred so an unused import cannot prevent every callback from collecting.
 * Reflection during a test remains an explicit adapter gap. */
export function unavailableNamespace(source, names, hooks) {
  const values = new Map(names.map(name => [name, hooks.deferred(source + '.' + name)]))
  const reason = 'Native module namespace is not bound: ' + source
  const observe = () => { if (hooks.observing()) hooks.unavailable(reason) }
  const value = key => {
    if (!values.has(key)) values.set(key, hooks.deferred(source + '.' + String(key)))
    return values.get(key)
  }
  return new Proxy({}, {
    ownKeys() { observe(); return [...values.keys()] },
    has(_target, key) { observe(); return values.has(key) },
    getOwnPropertyDescriptor(_target, key) {
      observe()
      return values.has(key) ? { configurable: true, enumerable: true, writable: false, value: values.get(key) } : undefined
    },
    get(_target, key) {
      if (key === 'then') return undefined
      if (key === Symbol.toStringTag) return 'Module'
      return value(key)
    },
  })
}
