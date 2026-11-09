import { expect, test } from 'bun:test'
import { unavailableNamespace } from '../unified/mermaid-fidelity/namespace.mjs'

test('unused unknown imports survive loader reflection; observing or invoking them remains a gap', async () => {
  let observing = false
  const gaps: string[] = []
  const unavailable = (reason: string): never => { gaps.push(reason); throw Error(reason) }
  const namespace: any = unavailableNamespace('./unbound.js', ['helper'], {
    observing: () => observing, unavailable,
    deferred: (reason: string) => () => unavailable(reason),
  })
  expect(Object.keys(namespace)).toEqual(['helper'])
  expect(Object.getOwnPropertyDescriptor(namespace, 'helper')?.value).toBe(namespace.helper)
  expect(await Promise.resolve(namespace)).toBe(namespace)
  expect(gaps).toEqual([])
  observing = true
  expect(() => namespace.helper()).toThrow('./unbound.js.helper')
  expect(() => Object.keys(namespace)).toThrow('Native module namespace')
  expect(() => 'helper' in namespace).toThrow('Native module namespace')
})
