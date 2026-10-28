# Project lineage

Catalog checked: 2026-10-18. 88 entities. Regenerate with `bun commands.ts support --lineage`.

Descendants without established distinct branding are excluded from normal comparisons, even with code changes. Owner/package scopes and runtime suffixes alone do not establish branding. Bindings and zero-ahead versions are also excluded. An explicit inclusion override retains these for version/runtime investigations. Selection guidance uses the recorded catalog snapshot, not a fresh upstream audit. Ports and changed forks remain separate. Zero-ahead descendants can be omitted from a current-engine comparison, but historical/build studies retain them. Measurement aliases require verified artifact, build, runtime and invocation equivalence through catalog-eligibility; lineage alone never supplies a score.

Arrows in the tree mean source fork, derivative, port or runtime binding as labelled. Independently rooted code can still be a documented port. Dependencies, vendoring and inspiration are listed separately below.

```text
├── 1jehuang/mermaid-rs-renderer [independent; distinct-or-unresolved]
│   ├── akashacms/mermaid-wasm-renderer [binding; SKIP: no-distinct-branding, shared-engine-runtime-binding]
│   ├── toeverything/mermaid-rs-renderer [fork; +6/−179; SKIP: no-distinct-branding]
│   └── woxQAQ/mermaid-rs-render-js [binding; SKIP: no-distinct-branding, shared-engine-runtime-binding]
├── aj-archipelago/merval [independent; distinct-or-unresolved]
├── AlexanderGrooff/mermaid-ascii [independent; distinct-or-unresolved]
│   ├── app-creative/mermaid-ascii [fork; +0/−128; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── Aurelian-Shuttleworth/mermaid-ascii [fork; +0/−128; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── CaptainCrouton89/mermaid-ascii [fork; +12/−114; SKIP: no-distinct-branding]
│   ├── catdevman/mermaid-ascii [fork; +0/−128; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── ColtWindy/mermaid-ascii [fork; +0/−126; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── drunkhacker/mermaid-ascii [fork; +19/−128; SKIP: no-distinct-branding]
│   ├── dydoc/mermaid-ascii [fork; +0/−128; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── jeis4wpi/mermaid-ascii [fork; +0/−128; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── ktrysmt/mermaid-ascii [fork; +1/−128; SKIP: no-distinct-branding]
│   ├── leonj1/mermaid-ascii [fork; +0/−128; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── pgavlin/mermaid-ascii [fork; +31/−126; SKIP: no-distinct-branding]
│   │   └── Chronostasys/mermaid-ascii [fork; +6/−0; SKIP: no-distinct-branding]
│   └── sgryjp/mermaid-ascii [fork; +0/−128; SKIP: no-distinct-branding, zero-ahead-version]
├── anomalyco/opencode [independent; distinct-or-unresolved]
│   └── 4nkitd/opencode-merman [port; distinct-or-unresolved]
├── chenyanchen/mermaid-formatter [independent; distinct-or-unresolved]
├── crafter-station/mermaid [independent; distinct-or-unresolved]
├── Dicklesworthstone/frankenmermaid [independent; distinct-or-unresolved]
├── emtyty/merslim [independent; distinct-or-unresolved]
├── evangwt/xmermaid [independent; distinct-or-unresolved]
├── excalidraw/mermaid-to-excalidraw [unverified; distinct-or-unresolved]
├── fasouto/termaid [independent; distinct-or-unresolved]
│   ├── mopi1402/termaid [fork; +0/−15; SKIP: no-distinct-branding, zero-ahead-version]
│   └── mopi1402/termaid-ts [port; SKIP: no-distinct-branding]
├── gotoailab/modern_mermaid [independent; distinct-or-unresolved]
├── inkeep/visimer [independent; distinct-or-unresolved]
├── justsml/rusty-mermaid [independent; distinct-or-unresolved]
├── kingsword09/mermansi [independent; distinct-or-unresolved]
├── kitlangton/merman [independent; distinct-or-unresolved]
├── KlangHaus/vitepress-plugin-diagram [independent; distinct-or-unresolved]
├── Latias94/merman [independent; distinct-or-unresolved]
├── mermaid-js/mermaid [root; distinct-or-unresolved]
│   ├── blackst0ne/mermaid [fork; +4/−15471; SKIP: no-distinct-branding]
│   ├── enrimr/mermaid [fork; +0/−15015; SKIP: zero-ahead-version]
│   ├── ioggstream/d3fend-mermaid [fork; +0/−780; SKIP: zero-ahead-version]
│   ├── jacob-lcs/mermaid [fork; +3/−3092; SKIP: no-distinct-branding]
│   ├── jgraph/mermaid [fork; +27/−1940; SKIP: no-distinct-branding]
│   ├── lishid/mermaid [fork; +0/−12752; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── lukilabs/beautiful-mermaid [derivative; distinct-or-unresolved]
│   │   ├── 01colyncelestine-stack/beautiful-mermaid [fork; +0/−23; SKIP: no-distinct-branding, zero-ahead-version]
│   │   ├── 2233admin/beautiful-mermaid [fork; +0/−0; SKIP: no-distinct-branding, zero-ahead-version]
│   │   ├── adewale/agentic-mermaid [fork; +1223/−0; distinct-or-unresolved]
│   │   ├── dfadler/zombie-mermaid [fork; +4042/−0; distinct-or-unresolved]
│   │   ├── fdotu/beautiful-mermaid [fork; +0/−23; SKIP: no-distinct-branding, zero-ahead-version]
│   │   ├── gmh5225/beautiful-mermaid [fork; +0/−23; SKIP: no-distinct-branding, zero-ahead-version]
│   │   ├── HealthSamurai/beautiful-mermaid [fork; +0/−0; SKIP: no-distinct-branding, zero-ahead-version]
│   │   ├── kais-radwan/ascii-mermaid [port; distinct-or-unresolved]
│   │   ├── ktrysmt/beautiful-mermaid [fork; +26/−12; SKIP: no-distinct-branding]
│   │   ├── Orbiter/beautiful-mermaid-py [fork; +10/−23; SKIP: no-distinct-branding]
│   │   ├── rohitg00/beautiful-mermaid [fork; +2/−23; SKIP: no-distinct-branding]
│   │   ├── Stars1233/beautiful-mermaid [fork; +0/−0; SKIP: no-distinct-branding, zero-ahead-version]
│   │   ├── theletterf/beautiful-mermaid [fork; +14/−23; SKIP: no-distinct-branding]
│   │   ├── thepanax/beautiful-mermaid [fork; +0/−0; SKIP: no-distinct-branding, zero-ahead-version]
│   │   ├── vercel-labs/beautiful-mermaid [fork; +16/−23; SKIP: no-distinct-branding]
│   │   ├── ysknsid25/beautiful-mermaid [fork; +6/−19; SKIP: no-distinct-branding]
│   │   └── zhenhuaa/mdv [fork; +5/−12; distinct-or-unresolved]
│   ├── lyngai/mermaid [fork; +0/−13476; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── mbostock/mermaid [fork; +0/−11787; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── Mermaid-Chart/mermaid-develop [fork; +0/−7450; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── NicolasNewman/mermaid [fork; +17/−4341; SKIP: no-distinct-branding]
│   ├── orestesgaolin/mermaid [port; distinct-or-unresolved]
│   ├── songshaodong/mermaid [fork; +0/−15918; SKIP: no-distinct-branding, zero-ahead-version]
│   ├── xen3r0/mermaid [fork; +2/−15335; SKIP: no-distinct-branding]
│   ├── xeolabs/mermaid [fork; +0/−9209; SKIP: no-distinct-branding, zero-ahead-version]
│   └── zakaria-forks/mermaid [fork; +0/−6092; SKIP: no-distinct-branding, zero-ahead-version]
├── mermaid-js/mermaid-live-editor [unverified; distinct-or-unresolved]
├── Mootikins/figurehead-rs [independent; distinct-or-unresolved]
├── neongreen/mermaid-ast [independent; distinct-or-unresolved]
├── obsidianmd/pele [independent; distinct-or-unresolved]
│   ├── crabtalk/bezel [port; distinct-or-unresolved]
│   └── wevm/ondine [port; distinct-or-unresolved]
├── probelabs/maid [independent; distinct-or-unresolved]
├── sandyyst/dsh-plugin-mermaid-gb-svg [independent; distinct-or-unresolved]
├── taoche/mermaid-reactflow-render [independent; distinct-or-unresolved]
├── tariqshams/mermaidtui [independent; distinct-or-unresolved]
├── tomoyukim/vscode-mermaid-editor [unverified; distinct-or-unresolved]
├── xai-org/grok-build [independent; distinct-or-unresolved]
│   ├── npm:tui-mermaid [port; distinct-or-unresolved]
│   ├── ramtinJ95/pi-mermaid-tui [binding; SKIP: shared-engine-runtime-binding]
│   ├── spacedock-dev/mermaidtext [port; distinct-or-unresolved]
│   └── xl0/lovely-mermaid [port; distinct-or-unresolved]
└── Yassimba/loom [independent; distinct-or-unresolved]
```

## Other relationships

- mermaid-js/mermaid-live-editor → mermaid-js/mermaid: depends-on (evidence recorded in catalog)
- tomoyukim/vscode-mermaid-editor → mermaid-js/mermaid: depends-on (evidence recorded in catalog)
- excalidraw/mermaid-to-excalidraw → mermaid-js/mermaid: depends-on (evidence recorded in catalog)
- gotoailab/modern_mermaid → mermaid-js/mermaid: depends-on (evidence recorded in catalog)
- obsidianmd/pele → mermaid-js/mermaid: vendors (evidence recorded in catalog)
- inkeep/visimer → mermaid-js/mermaid: depends-on (evidence recorded in catalog)
- kingsword09/mermansi → Latias94/merman: depends-on (evidence recorded in catalog)
- neongreen/mermaid-ast → mermaid-js/mermaid: depends-on (evidence recorded in catalog)
- fasouto/termaid → AlexanderGrooff/mermaid-ascii: inspired-by (evidence recorded in catalog)
- fasouto/termaid → lukilabs/beautiful-mermaid: inspired-by (evidence recorded in catalog)
- Mootikins/figurehead-rs → AlexanderGrooff/mermaid-ascii: inspired-by (evidence recorded in catalog)
- lukilabs/beautiful-mermaid → AlexanderGrooff/mermaid-ascii: component-port (evidence recorded in catalog)

## Comparison selection

25 zero-ahead forks are candidates to omit from current-engine comparisons. This saves work by narrowing the question; it does not assert that a newer parent score describes a historical descendant. 4 same-parent-head candidates also need artifact verification before any result reuse.

46 entries are excluded from normal comparisons by branding, version or binding policy. Changed forks still need distinct branding. Independently implemented ports also need an established separate brand under this selection rule. This is a comparison-scope choice, not a claim about code quality or behavior. Mermaid Dart is a distinct brand and remains eligible. Beautiful Mermaid is a derivative of Mermaid, not a Git fork; its ASCII component port is recorded separately.

Keep branded differentiated projects such as Agentic Mermaid, Zombie Mermaid, Beautiful Mermaid, Mermaid Dart and Ondine. Frankenmermaid has an independent root. Review unverified lineages before counting independent engines. Never silently transfer results between projects.

Use an explicit `bench --projects ... --plan` selection. `--include-excluded-descendants` is reserved for a named version/fork/runtime investigation. Community collection already measures verified physical-artifact aliases once and keeps per-entity evidence-reuse receipts; candidates without that proof run independently when explicitly selected.
