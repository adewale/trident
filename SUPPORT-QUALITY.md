# Quality of Trident support

Assessment: 2026-10-28. Trident has executed evidence for **40 of the 42 eligible entries**: 38 public-output integrations and two browser-editor workflows. The original 0.1 receipt covers 37 integrations; follow-up evidence adds editable Excalidraw conversion and the two editors, plus Crafter and Frankenmermaid terminal transports. Rusty Mermaid's published runtime and the VS Code host workflow remain blocked. The catalog still contains 88 entities, with 46 excluded from normal comparisons.

This assesses Trident integrations, not project quality or renderer speed. A successful call establishes a working public invocation for that input. It does not establish all-family compatibility, painted meaning, useful layout or calibrated timing. The earlier eight-project campaign supplies broader historical evidence for its own scopes, and is not silently rerun or upgraded.

## Support levels

| Level | Entries | Evidence |
|---|---:|---|
| Public output exercised | 38 | Actual admitted release artifacts, common inputs, positive output witnesses; remaining binding and qualification gaps below. |
| Release artifact blocked | 1 | Rusty Mermaid 0.42.0 omits its runtime. A separately identified 0.1.0 source candidate was built and exercised. |
| Browser-editor workflow exercised | 2 | Live Editor and Modern Mermaid pass input, edit, invalid-source error and recovery on one authored flowchart. Exports and broader editor coverage remain unmeasured. |
| VS Code host driver missing | 1 | The extension requires a real pinned VS Code extension host and webview workflow. |
| Excluded from normal comparisons | 46 | Full inventory and old support evidence retained; this campaign supplies no new invocation evidence for them. |

The 38 output integrations share the first level; the two editors have separate workflow evidence. This is a rank of current invocation evidence only. Counting optional model APIs as bonus points would favor projects with more observable internals. No project is certified as having complete support across every applicable benchmark.

## What improved

- Six additional public APIs have portable Node bindings: MDV, VitePress Plugin Diagram, Latias Merman, DSH Mermaid GB SVG, Crafter Mermaid and Merslim. There are now 15 configured portable bindings across the full catalog; four belong to excluded same-name descendants.
- The common check exercised 16 browser transports as well as Node, Dart/global, Rust/WASM, native CLI and Python transports. Browser-only APIs are never called through a guessed Node host.
- Ondine’s installed public `--ascii` CLI now has a verified terminal binding. Frankenmermaid exposes its public parse diagnostics, retaining warnings and failed rejection controls. Merslim exposes its public parse result and browser PNG API.
- Crafter’s public DOM SVG serialization and raw SVG-string API remain separate surfaces. Its raw string has malformed XML; the browser result cannot erase that finding.
- Public factories retain their receivers and dispose their instances. Separately installed parser/layout companions join the portable artifact identity.

## Follow-up evidence for issue #30

| Project / transport | Observed result | Scope and remaining gap |
|---|---|---|
| Crafter / published terminal package | 5/6 authored inputs passed | Actual `@crafter/mermaid-cli@0.0.4`, fixed 120-column host; SVG/XML finding remains. Published workspace dependency operands use recorded exact registry overrides; package files are unchanged. |
| Frankenmermaid / native release CLI | 6/6 terminal inputs passed | SHA-256-checked v0.4.0 Linux x64 archive, source tag d5ade10…; distinct from the WASM distribution at 29536a1…. Other native platforms are unreviewed. Mermaid source serialization remains unbound. |
| Mermaid to Excalidraw / browser API | 2/6 editable inputs passed; two invalid controls rejected | Flowchart and sequence preserve editable labels and declared relationships. Four image-only fallbacks are blocked, not editable-model successes. |
| Modern Mermaid / built application | 4/4 workflow steps passed | One flowchart through source entry, edited preview, error and recovery; no export or performance claim. |
| Mermaid Live Editor / built application | 4/4 workflow steps passed | Same workflow, using its real editor and preview rather than a substituted renderer. |

The [follow-up receipt](docs/evidence/support-issue30.json) preserves separate artifacts, transport versions and denominators. [Application contracts and commands](docs/application-contracts.md) describe the new workflow. The historical table below is the unchanged 0.1 snapshot; it does not acquire new outcomes from later work.

## Original 0.1 snapshot

Each fraction is successful authored inputs / 6 planned inputs for that particular format and transport. Non-successes include unsupported families, failed labels and blocked APIs; inspect the receipt for their separate dispositions. Negative controls are excluded from these fractions. A positive diagnostic call does not prove that a validator rejects invalid input.

| Project | Actual version | Output witnesses | Remaining binding or admission findings |
|---|---|---|---|
| 1jehuang/mermaid-rs-renderer | v0.3.1 | svg/cli 6/6; png/cli 6/6 | No unbound declared format; broader qualification remains separate |
| 4nkitd/opencode-merman | 0.1.1 | terminal/node 6/6 | No unbound declared format; broader qualification remains separate |
| adewale/agentic-mermaid | 0.4.1 | svg/node 6/6; terminal/node 6/6; png/node 6/6; parse/node 6/6; svg/public-package-cli 6/6; terminal/public-package-cli 6/6; svg/browser 6/6 | No unbound declared format; broader qualification remains separate |
| aj-archipelago/merval | 1.0.7 | diagnostics/node 6/6 | diagnostics/node: 1 failed controls |
| AlexanderGrooff/mermaid-ascii | 1.6.1 | terminal/cli 3/6 | No unbound declared format; broader qualification remains separate |
| anomalyco/opencode | 2.0.26 | terminal/node 3/6 | No unbound declared format; broader qualification remains separate |
| chenyanchen/mermaid-formatter | 0.3.0 | source/node 6/6 | No unbound declared format; broader qualification remains separate |
| crabtalk/bezel | 0.2.21 | svg/global 6/6; svg/browser 6/6 | No unbound declared format; broader qualification remains separate |
| crafter-station/mermaid | 0.0.3 | svg/node 0/6; parse/node 5/6; svg/browser 5/6 | Declared output has no binding: terminal; svg/node: no-positive-witness; svg/browser: 1 failed controls |
| dfadler/zombie-mermaid | 5.10.2 | svg/node 6/6; terminal/node 6/6; svg/browser 6/6 | No unbound declared format; broader qualification remains separate |
| Dicklesworthstone/frankenmermaid | 0.4.0 | svg/franken 6/6; parse/franken 6/6; diagnostics/franken 6/6; svg/browser 6/6 | Declared output has no binding: terminal; Declared output has no binding: source; diagnostics/franken: 2 failed controls |
| emtyty/merslim | 0.2.3 | svg/node 3/6; terminal/node 4/6; parse/node 4/6; svg/browser 4/6; png/browser 6/6 | svg/browser: 3 failed controls |
| evangwt/xmermaid | 0.4.2 | svg/browser 6/6 | No unbound declared format; broader qualification remains separate |
| excalidraw/mermaid-to-excalidraw | not admitted | unmeasured | Applicable catalog operations have no admitted adapter; explicitly unmeasured |
| fasouto/termaid | 0.10.0 | terminal/python 6/6 | No unbound declared format; broader qualification remains separate |
| gotoailab/modern_mermaid | not admitted | unmeasured | Applicable catalog operations have no admitted adapter; explicitly unmeasured |
| inkeep/visimer | 1.1.3 | parse/node 6/6 | No unbound declared format; broader qualification remains separate |
| justsml/rusty-mermaid | not admitted | unmeasured | Published rusty-mermaid@0.42.0 omits pkg/rusty_mermaid.js and its WASM runtime; public release could not be invoked. |
| kais-radwan/ascii-mermaid | 0.1.0 | terminal/node 6/6 | No unbound declared format; broader qualification remains separate |
| kingsword09/mermansi | v0.1.6 | terminal/cli 6/6 | No unbound declared format; broader qualification remains separate |
| kitlangton/merman | 0.2.1 | terminal/node 3/6 | No unbound declared format; broader qualification remains separate |
| KlangHaus/vitepress-plugin-diagram | 0.3.2 | svg/node 3/6; svg/browser 3/6 | No unbound declared format; broader qualification remains separate |
| Latias94/merman | 0.9.2 | svg/node 6/6; png/node 0/6; svg/browser 6/6 | Declared output has no binding: jpeg; Declared output has no binding: pdf; Declared output has no binding: terminal; png/node: blocked |
| lukilabs/beautiful-mermaid | 1.1.3 | svg/node 5/6; terminal/node 5/6; svg/browser 5/6 | No unbound declared format; broader qualification remains separate |
| mermaid-js/mermaid | 12.2.0 | parse/node 6/6; svg/browser 6/6 | No unbound declared format; broader qualification remains separate |
| mermaid-js/mermaid-live-editor | not admitted | unmeasured | Applicable catalog operations have no admitted adapter; explicitly unmeasured |
| Mootikins/figurehead-rs | v0.4.3 | terminal/cli 4/6 | No unbound declared format; broader qualification remains separate |
| neongreen/mermaid-ast | 0.8.2 | parse/node 6/6 | No unbound declared format; broader qualification remains separate |
| npm:tui-mermaid | 0.1.0 | terminal/node 5/6 | No unbound declared format; broader qualification remains separate |
| obsidianmd/pele | 1.9.0 | svg/node 6/6; svg/browser 6/6 | No unbound declared format; broader qualification remains separate |
| orestesgaolin/mermaid | 0.3.2 | svg/global 6/6; svg/browser 6/6 | Declared output has no binding: png |
| probelabs/maid | 0.0.29 | diagnostics/node 5/6 | No unbound declared format; broader qualification remains separate |
| sandyyst/dsh-plugin-mermaid-gb-svg | 0.1.4 | svg/node 1/6; svg/browser 1/6 | svg/browser: 5 failed controls |
| spacedock-dev/mermaidtext | git-a6b0c7657b94 | terminal/cli 5/6 | No unbound declared format; broader qualification remains separate |
| taoche/mermaid-reactflow-render | 0.5.1 | react-flow/node 1/6 | No unbound declared format; broader qualification remains separate |
| tariqshams/mermaidtui | 0.0.6 | terminal/node 1/6 | No unbound declared format; broader qualification remains separate |
| tomoyukim/vscode-mermaid-editor | not admitted | unmeasured | Applicable catalog operations have no admitted adapter; explicitly unmeasured |
| wevm/ondine | 0.0.3 | svg/node 6/6; terminal/public-package-cli 6/6; svg/browser 6/6 | No unbound declared format; broader qualification remains separate |
| xai-org/grok-build | git-2bdd1d6a6369 | terminal/cli 5/6 | No unbound declared format; broader qualification remains separate |
| xl0/lovely-mermaid | 0.3.3 | terminal/node 6/6 | No unbound declared format; broader qualification remains separate |
| Yassimba/loom | 0.10.0 | terminal/node 6/6 | No unbound declared format; broader qualification remains separate |
| zhenhuaa/mdv | 0.1.2 | svg/node 5/6; terminal/node 5/6; svg/browser 5/6 | No unbound declared format; broader qualification remains separate |

## What prevents complete support

The first remaining work is format-specific: Mermaid Dart PNG; Frankenmermaid terminal and source; Crafter terminal; and Latias Merman terminal/JPEG/PDF. The installed Latias native target exposes SVG, layout JSON, semantic JSON and SVG-plan JSON, but no PNG operation. Those capabilities need separate public target/build review. Trident must not rasterize someone’s SVG and report it as their native PNG API.

Rusty Mermaid’s published 0.42.0 package cannot run. The public source at `ce95d8ddb8323006b6dd8ddbc616c2478c3827aa` identifies itself as 0.1.0; its WASM build runs through the existing candidate workflow and retains four failed smoke observations. See the [reproduction notes](RUSTY-MERMAID.md). It does not replace the broken release artifact.

The four application integrations need their own input, action and output contracts before comparing editor or converter behavior. Giving them another engine’s SVG timings would misattribute the work.

Full support also requires applicable documentation, meaning and public-model checks, suitable terminal semantics, negative controls and runtime-appropriate timing. The six-case check only establishes where to begin those campaigns. The maintainer maintains both Trident and Agentic Mermaid; common output observers, independent input contributions and external adapter review remain necessary.

## Every catalog entity

The ledger below retains all 88 identities. Excluded entities have configuration metadata rather than new execution evidence. They do not inherit their parent’s results.

| Entity | This verification | Normal comparison |
|---|---|---|
| 01colyncelestine-stack/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| 1jehuang/mermaid-rs-renderer | partially-verified | eligible |
| 2233admin/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| 4nkitd/opencode-merman | partially-verified | eligible |
| adewale/agentic-mermaid | partially-verified | eligible |
| aj-archipelago/merval | partially-verified | eligible |
| akashacms/mermaid-wasm-renderer | not selected; configured evidence only | skip: no-distinct-branding, shared-engine-runtime-binding |
| AlexanderGrooff/mermaid-ascii | partially-verified | eligible |
| anomalyco/opencode | partially-verified | eligible |
| app-creative/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| Aurelian-Shuttleworth/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| blackst0ne/mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| CaptainCrouton89/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding |
| catdevman/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| chenyanchen/mermaid-formatter | partially-verified | eligible |
| Chronostasys/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding |
| ColtWindy/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| crabtalk/bezel | partially-verified | eligible |
| crafter-station/mermaid | partially-verified | eligible |
| dfadler/zombie-mermaid | partially-verified | eligible |
| Dicklesworthstone/frankenmermaid | partially-verified | eligible |
| drunkhacker/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding |
| dydoc/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| emtyty/merslim | partially-verified | eligible |
| enrimr/mermaid | not selected; configured evidence only | skip: zero-ahead-version |
| evangwt/xmermaid | partially-verified | eligible |
| excalidraw/mermaid-to-excalidraw | conversion partially verified | eligible |
| fasouto/termaid | partially-verified | eligible |
| fdotu/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| gmh5225/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| gotoailab/modern_mermaid | editor workflow verified | eligible |
| HealthSamurai/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| inkeep/visimer | partially-verified | eligible |
| ioggstream/d3fend-mermaid | not selected; configured evidence only | skip: zero-ahead-version |
| jacob-lcs/mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| jeis4wpi/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| jgraph/mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| justsml/rusty-mermaid | blocked | eligible |
| kais-radwan/ascii-mermaid | partially-verified | eligible |
| kingsword09/mermansi | partially-verified | eligible |
| kitlangton/merman | partially-verified | eligible |
| KlangHaus/vitepress-plugin-diagram | partially-verified | eligible |
| ktrysmt/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| ktrysmt/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding |
| Latias94/merman | partially-verified | eligible |
| leonj1/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| lishid/mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| lukilabs/beautiful-mermaid | partially-verified | eligible |
| lyngai/mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| mbostock/mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| Mermaid-Chart/mermaid-develop | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| mermaid-js/mermaid | partially-verified | eligible |
| mermaid-js/mermaid-live-editor | editor workflow verified | eligible |
| Mootikins/figurehead-rs | partially-verified | eligible |
| mopi1402/termaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| mopi1402/termaid-ts | not selected; configured evidence only | skip: no-distinct-branding |
| neongreen/mermaid-ast | partially-verified | eligible |
| NicolasNewman/mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| npm:tui-mermaid | partially-verified | eligible |
| obsidianmd/pele | partially-verified | eligible |
| Orbiter/beautiful-mermaid-py | not selected; configured evidence only | skip: no-distinct-branding |
| orestesgaolin/mermaid | partially-verified | eligible |
| pgavlin/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding |
| probelabs/maid | partially-verified | eligible |
| ramtinJ95/pi-mermaid-tui | not selected; configured evidence only | skip: shared-engine-runtime-binding |
| rohitg00/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| sandyyst/dsh-plugin-mermaid-gb-svg | partially-verified | eligible |
| sgryjp/mermaid-ascii | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| songshaodong/mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| spacedock-dev/mermaidtext | partially-verified | eligible |
| Stars1233/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| taoche/mermaid-reactflow-render | partially-verified | eligible |
| tariqshams/mermaidtui | partially-verified | eligible |
| theletterf/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| thepanax/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| toeverything/mermaid-rs-renderer | not selected; configured evidence only | skip: no-distinct-branding |
| tomoyukim/vscode-mermaid-editor | blocked | eligible |
| vercel-labs/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| wevm/ondine | partially-verified | eligible |
| woxQAQ/mermaid-rs-render-js | not selected; configured evidence only | skip: no-distinct-branding, shared-engine-runtime-binding |
| xai-org/grok-build | partially-verified | eligible |
| xen3r0/mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| xeolabs/mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| xl0/lovely-mermaid | partially-verified | eligible |
| Yassimba/loom | partially-verified | eligible |
| ysknsid25/beautiful-mermaid | not selected; configured evidence only | skip: no-distinct-branding |
| zakaria-forks/mermaid | not selected; configured evidence only | skip: no-distinct-branding, zero-ahead-version |
| zhenhuaa/mdv | partially-verified | eligible |

[Verification receipt](docs/evidence/support-0.1.json) records actual artifact identities, per-format dispositions, control counts and the owning report digest. The release evidence archive retains raw outputs and the producer closure. Run `bun commands.ts support` for current configuration and `support:verify --help` for a fresh admission check. [Benchmark methods](BENCHMARKS.md) and [report reading](REPORTING.md) describe broader campaign evidence.
