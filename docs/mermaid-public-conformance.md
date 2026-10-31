# Original Mermaid public tests

This collector executes unchanged callbacks from Mermaid's own tests at
[`1fb7869`](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b).
The current scope is 41 callbacks: 16 public `parse` tests from
`mermaidAPI.spec.ts`/`mermaid.spec.ts`, six public detector tests from
`utils.spec.ts`, and 19 parameterized accessibility render callbacks from
`mermaidAPI.spec.ts`. These correspond to 23 original test declarations. It tests public API compatibility: accepted input, rejection,
`suppressErrors`, returned diagram family/configuration, and exact original
error/return snapshots. It does not measure drawing accuracy or speed.

The fixed denominator includes every selected callback. Unsupported validation,
failed assertions, missing public fields and incomplete evidence remain distinct
nonpasses. A binding that preserves unknown syntax cannot earn rejection credit
by throwing an adapter error. Counts refer to callbacks, not individual matchers.
Any table must rank by passes over the same 41 planned callbacks and show all
nonpass counts. It must label this parse/detector/structural render scope, never “Mermaid conformance” for
the entire test suite.

Detection tests call the actual public detector. They never substitute a parser
or a source recognizer implemented by Trident. Tests that also assert private
preprocessing output remain pending rather than crediting untouched reference
code to peers.

The render matrix executes the original `jsdomIt` wrapper under the original
Vitest `jsdom` environment. That helper supplies its own DOM and its original
mocked geometry (`getBBox` 666×666, text length 200). Tests assert accessibility
role, title, description and exact caller-ID associations; they cannot establish
layout quality or painted geometry. A source-defined list of 19 parameter values
freezes expanded callback identities before execution. The literal callback and
all five original assertions remain unchanged.

Peer SVG strings are never edited to match Mermaid metadata. The matrix requires
Mermaid's exact caller-supplied identifier convention. A peer can produce an
accessible drawing and fail this strict public API compatibility requirement.
Its receipt identifies whether the native API accepts a caller ID/container;
Trident never invents that missing input or adds matching SVG attributes.

## Reference qualification

First the actual pinned source runs under its original Vitest/Vite configuration.
Then the same callbacks and assertions run while a SHA-bound plugin replaces only
the implementation body of `parse` with the installed reference's public
`mermaid.parse`. Both runs must pass every callback before a peer result exists.
The source, callbacks, snapshots, native reports, invocation events, installed
entries/dependency closures and producer identities are retained. No candidate
outcome changes eligibility. This route does not use the retired private parser/
DB-projection Assertion Replay.

Run explicitly with a fresh output directory and reviewed public bindings:

```sh
bun unified/public-conformance.ts --source PINNED_MERMAID_CHECKOUT \
  --runner-root ORIGINAL_RUNTIME --bindings BINDINGS.json --out FRESH_DIRECTORY
```

The source checkout and runtime must resolve the same original Vitest instance.
`--inventory-only` needs no bindings and executes no parser.

## What remains unqualified

The complete source census has 4,060 declarations across 368 files. It includes
parameterized declarations and `jsdomIt` wrappers; it is not a claim of 4,060
expanded runnable cases. Static source review records public operations, private
imports and unresolved dependencies for every declaration. Only upstream-disabled
tests are excluded without further contract review. A private import is a review
candidate, not proof that inherited setup or a helper has no public contract.

Broader conformance remains blocked on these separate contracts:

- Further rendering: sanitization, rendering failures, non-accessibility SVG
  contracts and browser lifecycle tests still need reviewed peer-equivalent
  bindings. The qualified accessibility matrix supplies no drawing-accuracy pass.
- Configuration: site configuration, reset and deprecated private getters must be
  separated from configuration accepted or returned by a peer's public interface.
- Models: `getDiagramFromText` tests mix public entry points with private DB shapes
  and Mermaid class identities. Those assertions cannot be translated into a
  different project model and still called original-test conformance.
- Registration and DOM lifecycle: external diagrams, loaders, icon packs, host DOM
  execution and parse-error handlers need their own reviewed public contracts.
- Further detection tests: callbacks mixing private preprocessing or private
  registration setup require separate review; they cannot inherit this scope.
- Inventory review: indirect helpers, inherited hooks and parameter expansion
  require review before declaring any remaining test eligible or internal-only.

The machine report keeps `wholeSuiteConformanceQualified: false`. A successful
41-callback run does not clear those blockers.
