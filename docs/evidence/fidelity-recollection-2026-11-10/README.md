# Mermaid Fidelity recollection

This collection replaces the 0.3.0 Fidelity results for all 26 candidates. It
uses the 7 November product freeze, the Mermaid 12.3.0 source pin and the same
352 original test files. Only the Fidelity worker changed; DaveBench and Drawing
results are unaffected. The [collection record](collection.json) holds identities,
profile hashes, qualification and per-candidate counts.

## What changed in the worker

- An unused, unbound production import defers until used, so it no longer aborts
  original test files before collection.
- Reading, calling, constructing or reflecting on an unavailable export, database
  member or module namespace records an adapter gap, even when the test catches
  the error or ignores the value. Adapter-created placeholders cannot satisfy an
  assertion.
- A worker that cannot start or accept a request reports an adapter gap. Before,
  a startup error could surface as a parser failure or satisfy a negative assertion.
- Persistent bridges are reaped when they stop (#97). The campaign started and ended
  with no zombie processes.

These are the boundary changes from #93, merged with #94's multi-family contexts,
Agentic bindings and namespace-import audit. The worker was frozen before collection.
Rebasing onto later commits left every hashed harness file unchanged (harness digest
`e611e63f68da044a…`).

## Collection

| Profile | Window (UTC) | Targets |
|---|---|---:|
| JSDOM | 10 Nov 19:54–20:43 | control + 26 |
| Node | 10 Nov 20:43–21:10 | 26, reusing the JSDOM control |
| Automatic selection | 10 Nov 21:10–21:12 | Merslim |

The control passes all 7,346 active callbacks. No candidate was blocked. Node
qualification accepts 320 files in common, with one or two
candidate-specific additions each. The automatic Merslim run used 321 Node and 31
JSDOM file environments and reproduced all 7,364 JSDOM callback dispositions,
reasons and operation counts. Runtime: Node 24.22.2 with npm 11.19.1, Bun 1.4.4 and
Dart 3.13.7 on Linux x64.

## Results

| Across 26 candidates | 0.3.0 | Recollected |
|---|---:|---:|
| Passed | 25,479 | 26,645 |
| Assertion/fault nonpasses | 22,559 | 22,707 |
| Unsupported operations | 43,159 | 49,660 |
| Unassessed | 99,799 | 91,984 |

3,499 reference-qualified callbacks are unassessed for every candidate, and
942 of those have no collected candidate callback. Beyond that shared set, candidates
have 1,010 additional gap observations between them.

| Candidate | Passed 0.3.0 | Passed now | Unassessed 0.3.0 | Unassessed now |
|---|---:|---:|---:|---:|
| `obsidianmd/pele` | 3,055 | 3,263 | 3,879 | 3,611 |
| `crabtalk/bezel` | 2,961 | 3,173 | 3,851 | 3,567 |
| `Latias94/merman` | 2,775 | 2,935 | 3,878 | 3,593 |
| `adewale/agentic-mermaid` | 2,178 | 2,247 | 3,853 | 3,566 |
| `orestesgaolin/mermaid` | 2,085 | 2,127 | 3,845 | 3,562 |
| `pub:mermaid_flutter` | 2,085 | 2,127 | 3,845 | 3,562 |
| `1jehuang/mermaid-rs-renderer` | 1,432 | 1,481 | 3,868 | 3,554 |
| `Dicklesworthstone/frankenmermaid` | 1,254 | 1,326 | 3,880 | 3,601 |
| `fasouto/termaid` | 1,055 | 1,078 | 3,844 | 3,534 |
| `dfadler/zombie-mermaid` | 957 | 979 | 3,822 | 3,513 |
| `evangwt/xmermaid` | 878 | 894 | 3,843 | 3,645 |
| `Yassimba/loom` | 730 | 752 | 3,841 | 3,531 |
| `AlexanderGrooff/mermaid-ascii` | 722 | 722 | 3,822 | 3,507 |
| `xai-org/grok-build` | 618 | 639 | 3,822 | 3,510 |
| `spacedock-dev/mermaidtext` | 618 | 639 | 3,822 | 3,510 |
| `Mootikins/figurehead-rs` | 341 | 362 | 3,822 | 3,511 |
| `kais-radwan/ascii-mermaid` | 332 | 354 | 3,822 | 3,513 |
| `emtyty/merslim` | 298 | 319 | 3,822 | 3,515 |
| `wevm/ondine` | 263 | 305 | 3,823 | 3,529 |
| `lukilabs/beautiful-mermaid` | 214 | 236 | 3,822 | 3,511 |
| `crafter-station/mermaid` | 217 | 230 | 3,847 | 3,512 |
| `KlangHaus/vitepress-plugin-diagram` | 144 | 144 | 3,829 | 3,510 |
| `sandyyst/dsh-plugin-mermaid-gb-svg` | 128 | 128 | 3,822 | 3,499 |
| `anomalyco/opencode` | 88 | 126 | 3,828 | 3,508 |
| `kitlangton/merman` | 51 | 59 | 3,825 | 3,510 |
| `tariqshams/mermaidtui` | 0 | 0 | 3,822 | 3,500 |

## Passes that became unassessed

Per-file counts were compared with 0.3.0. Passes fell in two places:

- One `sequenceDiagram.spec.js` callback for 13 candidates. The same result appears
  with main's worker before these changes, so it follows #94's sequence lifecycle
  and renderer bindings.
- Two XMermaid `flow.spec.js` callbacks call `flow.parser.yy.getClasses()`, which
  the candidate does not offer. The call is now an adapter gap even though the test
  does not assert on its result.

Measured nonpasses that became unassessed were adapter-created failures, such as
reads of the unbound `diagramAPI` namespace or Mermaid's renderer.

## Reproduction

```sh
bun commands.ts prepare --catalog docs/evidence/benchmark-campaign-2026-11-07/catalog.json --out artifacts
TRIDENT_FIDELITY_ENVIRONMENT=jsdom bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --workers 3 --out fidelity-jsdom
TRIDENT_FIDELITY_ENVIRONMENT=node bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --reuse-reference fidelity-jsdom --workers 3 --out fidelity-node
bun scripts/qualify-dom-free.ts fidelity-jsdom fidelity-node 2086904e76c692331e34a45d7cc3bc30860d040e dom-free-qualified.json
cp dom-free-qualified.json unified/mermaid-fidelity/dom-free-files.json
bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --reuse-reference fidelity-jsdom --projects emtyty/merslim --workers 3 --out fidelity-auto
bun scripts/merge-fidelity-runs.ts --catalog CATALOG --out mermaid-fidelity.json fidelity-jsdom
```

`pub:mermaid_flutter` has no prepared artifact. Its Dart bridge finds
`mermaid_core` 0.3.2 through `PUB_CACHE`, which should point at the pub cache the
preparation filled. Bezel's WebAssembly build needs the `wasm32-unknown-unknown`
target and `wasm-bindgen-cli` 0.2.104.
