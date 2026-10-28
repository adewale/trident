# Trident

Trident benchmarks tools that read Mermaid: SVG renderers, terminal renderers and parsers. Start with a question, choose the benchmark that answers it, and keep its failures alongside its measurements.

- [Benchmarks and their value](BENCHMARKS.md): what each workload measures, how to run it, and when to trust it.
- [Methodology](METHODOLOGY.md): corpus, correctness checks, sampling and fair comparisons.
- [Measurement rules](MEASUREMENT.md): interfaces, cache state, overfitting and claims.
- [Catalog and support](CATALOG.md): what the entries mean and which suites have bindings.
- [Verified support](SUPPORT-QUALITY.md): executed public interfaces and remaining gaps for every catalog entry.
- [Comparison contracts](FAIRNESS.md): planning, independent inputs and unranked publication.
- [Results](results/README.md): old snapshots have been removed; no current scores are claimed.

## Benchmarks

Choose the question before collecting results. These seven benchmarks have
different inputs and units; Trident does not combine them into an overall score.
The command IDs stay short so existing scripts continue to work.

| Benchmark | Command ID | What it measures and why to use it |
|---|---|---|
| **Mermaid Compatibility** | `community` | Which frozen examples produce SVG, terminal text, PNG or a parser result? Use it to find unsupported syntax, broken interfaces and output failures. Format and label checks do not prove a faithful drawing. |
| **DaveBench: Documentation Examples** | `docs` | Which examples in the pinned Mermaid syntax documentation return SVG? Reports coverage and public render-call time on each pair's common successful examples. Use it for a broad documentation workload; returning SVG does not prove correct paint. |
| **Diagram Meaning** | `fidelity` | Does the actual SVG preserve authored relationships, labels, values and visible geometry? Use it to find wrong or missing drawn meaning. It covers declared criteria, not every aesthetic or accessibility concern. |
| **Model and Editing Contracts** | `native-fidelity` | Do reviewed public model APIs preserve identities, relationships and edit/configuration behavior? Use it for deeper diagnostics where a model projection exists. A missing projection is a Trident support gap, not evidence of a bad renderer. |
| **Mermaid Assertion Replay** | `upstream-fidelity` | Which original Mermaid test assertions work through another project's public model/parser API? Use it to examine compatibility. Private API and diagnostic-wording differences can fail without proving a wrong drawing. |
| **Mermaid Reference Tests** | `upstream-original` | Does pinned Mermaid pass its own original core test runner? Use it to validate the reference environment. It runs Mermaid's tests against Mermaid, so it is not a peer-project score. |
| **Render Cost and Scaling** | `portable` | What do fresh calls, repeated calls, edits and larger diagrams cost through a public Node SVG API? Reports latency, CPU and memory separately, with output checks and A/A noise controls. Use it for controlled regressions; it is not a production-traffic forecast. |

### Where the benchmarks come from

**DaveBench** entered Trident through [Agentic Mermaid's documentation benchmark](https://github.com/adewale/agentic-mermaid/blob/main/eval/benchmark/docs/davebench.md).
That historical runner used 1,095 occurrences from AM's vendored Mermaid docs,
with 546 distinct examples across 34 pages, and built an AM candidate beside fixed
comparators. Trident's `docs` benchmark reads the raw syntax pages at the pinned
[Mermaid source commit](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/docs/syntax)
and accepts prepared public project artifacts. Its recorded inventory and protocol
define each run; its counts and timings are not interchangeable with historical
DaveBench results. The linked inherited method is the provenance we can document;
we do not claim to reproduce an unpublished original implementation.

**Mermaid Assertion Replay** and **Mermaid Reference Tests** reuse Mermaid's
original tests at that same pin. Replay translates reviewed public API boundaries;
the reference benchmark executes the genuine original core runner. Their scopes
and exclusions are documented in [the fidelity guide](fidelity/README.md).

**Mermaid Compatibility** uses an [AM-origin frozen corpus](corpus/community-corpus.json)
and can run explicitly selected inputs, including [examples from pinned external projects](corpus/external-sources.json).
Input provenance and licenses travel with the frozen inventory. **Diagram Meaning**,
**Model and Editing Contracts**, and **Render Cost and Scaling** use authored cases
developed in AM and Trident; they are not external benchmark standards or production
traffic. Public examples and development fixtures are not a validated holdout.

See [methods, commands and limitations](BENCHMARKS.md) for each benchmark. The
six-input `support:verify` check tests invocation readiness; it is not an eighth
benchmark or a substitute for a complete campaign.

## Supported projects

The 0.1 support check exercised public output interfaces for **37 projects**.
The list below records at least one successful authored input per listed output;
it does not certify every family or every benchmark. [Verified versions, transports,
failures and missing formats](SUPPORT-QUALITY.md) remain explicit.

| SVG-rendering project | Outputs exercised successfully |
|---|---|
| [Agentic Mermaid](https://github.com/adewale/agentic-mermaid) | SVG, terminal, PNG, parser |
| [Beautiful Mermaid](https://github.com/lukilabs/beautiful-mermaid) | SVG, terminal |
| [Bezel](https://github.com/crabtalk/bezel) | SVG |
| [Crafter Mermaid](https://github.com/crafter-station/mermaid) | Browser DOM SVG, parser; raw Node SVG has a retained XML failure |
| [DSH Mermaid GB SVG](https://github.com/sandyyst/dsh-plugin-mermaid-gb-svg) | SVG |
| [Frankenmermaid](https://github.com/Dicklesworthstone/frankenmermaid) | SVG, parser, diagnostics |
| [Latias Merman](https://github.com/Latias94/merman) | SVG |
| [MDV](https://github.com/zhenhuaa/mdv) | SVG, terminal |
| [Mermaid Dart](https://github.com/orestesgaolin/mermaid) | SVG |
| [Mermaid.js](https://github.com/mermaid-js/mermaid) | Browser SVG, parser |
| [Mermaid RS Renderer](https://github.com/1jehuang/mermaid-rs-renderer) | SVG, PNG |
| [Merslim](https://github.com/emtyty/merslim) | SVG, terminal, parser, browser PNG |
| [Ondine](https://github.com/wevm/ondine) | SVG, public CLI terminal output |
| [Pele](https://github.com/obsidianmd/pele) | SVG |
| [VitePress Plugin Diagram](https://github.com/KlangHaus/vitepress-plugin-diagram) | SVG |
| [XMermaid](https://github.com/evangwt/xmermaid) | Browser SVG |
| [Zombie Mermaid](https://github.com/dfadler/zombie-mermaid) | SVG, terminal |

Terminal-only interfaces are exercised for [ASCII Mermaid](https://github.com/kais-radwan/ascii-mermaid),
[Figurehead](https://github.com/Mootikins/figurehead-rs), [Grok Build](https://github.com/xai-org/grok-build),
[Kitlangton Merman](https://github.com/kitlangton/merman), [Loom](https://github.com/Yassimba/loom),
[Lovely Mermaid](https://github.com/xl0/lovely-mermaid), [Mermaid ASCII](https://github.com/AlexanderGrooff/mermaid-ascii),
[Mermaidtext](https://github.com/spacedock-dev/mermaidtext), [MermaidTUI](https://github.com/tariqshams/mermaidtui),
[Mermansi](https://github.com/kingsword09/mermansi), [OpenCode](https://github.com/anomalyco/opencode),
[OpenCode Merman](https://github.com/4nkitd/opencode-merman), [Termaid](https://github.com/fasouto/termaid)
and [TUI Mermaid](https://www.npmjs.com/package/tui-mermaid).

Other exercised interfaces are [Maid](https://github.com/probelabs/maid) and
[Merval](https://github.com/aj-archipelago/merval) diagnostics,
[Mermaid AST](https://github.com/neongreen/mermaid-ast) and [Visimer](https://github.com/inkeep/visimer) parsing,
[Mermaid Formatter](https://github.com/chenyanchen/mermaid-formatter) source formatting,
and [Mermaid ReactFlow Render](https://github.com/taoche/mermaid-reactflow-render) graph conversion.

Five eligible entries are **blocked**: Rusty Mermaid's published package omits its
runtime, while Mermaid Live Editor, VS Code Mermaid Editor, Mermaid to Excalidraw
and Modern Mermaid need application/conversion benchmark contracts. They are not
counted as supported above. The [catalog](CATALOG.md) retains all 88 entries;
46 descendants or shared-engine bindings are excluded from normal comparisons.
[Issue #30](https://github.com/adewale/trident/issues/30) tracks the remaining support work.

## Project lineage

![Project lineage rendered by Agentic Mermaid: Beautiful is a derivative of Mermaid.js; Mermaid Dart is a distinct Dart port; Agentic and Zombie fork Beautiful; Pele has Ondine and Bezel ports; Frankenmermaid has an independent root.](docs/images/lineage.svg)

Selected renderer lineages. Beautiful Mermaid is a derivative of Mermaid, not a
Git fork; its ASCII component separately ports Mermaid ASCII. Mermaid Dart is a
distinctive brand and remains eligible. Agentic Mermaid rendered this overview
with its publication-figure look and Nord Light palette. Appearance implies no
benchmark rank. See the [complete 88-entity tree](LINEAGE.md), [source](docs/lineage-overview.mmd)
and [generation receipt](docs/images/lineage.json).

## Install 0.1

Use the `v0.1.0` GitHub source tag with Bun 1.4+ and Node 24+. Build a portable
Node kit with the command below; published archives, when available, appear on
the [GitHub releases page](https://github.com/adewale/trident/releases).
The repository package is private. The kit ships its runtime files and manifest,
while target artifacts and the pinned Mermaid oracle are installed separately.

```sh
node commands.ts --version
```

See [release notes](CHANGELOG.md) and the [release procedure](RELEASE.md) for
validation scope, artifact checksums and known limits.

## Benchmark a project

Install Bun 1.4+, Node 24+, npm and the package dependencies. The oracle is pinned Mermaid 12.2.0, its parser and first-party ZenUML addon. Browser measurements require Chromium; compiled projects also need their declared toolchains.

```sh
bun install --frozen-lockfile
node commands.ts mermaid:install
bunx playwright install chromium
bun commands.ts community:update --projects obsidianmd/pele,mermaid-js/mermaid \
  --profile full --rounds 5 --records /evidence/records --out /evidence/run
bun commands.ts results:publish --records /evidence/records --out /evidence/report
```

Inspect `bun commands.ts support` and `bun commands.ts bench --projects OWNER/TOOL --plan` before collecting. Execution requires a project selection or explicit `--all-projects`. Choose any project in [the catalog](catalog/mermaid-community.json). Use `--executable /path/to/chromium` for an existing browser. Exact matching records are reused with their original dates; `--force` collects a new attempt. `community:update --plan` prepares artifacts and reports reuse decisions without timing; `bench --plan` performs no acquisition or rendering. Measurements are local and reject CI.

Every tool uses its catalog release. To measure an unreleased npm package, select one project and add `--candidate-dir /path/to/built/package`, or `--candidate-tarball FILE --candidate-sha256 HEX`. Source-built projects accept `--candidate-revision COMMIT [--candidate-remote URL_OR_CLONE]`. Candidates stay separate from release rows:

```sh
bun commands.ts community:update --projects OWNER/TOOL --candidate-dir /artifacts/package \
  --profile full --rounds 5 --records /evidence/records --out /evidence/candidate
bun commands.ts results:compare --records /evidence/records --project OWNER/TOOL
```

A checkout, environment variable or local `dist/` never silently replaces a community release. Agentic Mermaid uses these same rules.

## Native Flutter entrypoints

The standalone [native Flutter / Chromium campaign](native-flutter/README.md)
measures `mermaid_flutter` 0.3.2 widgets and PNG export in a native Linux release
application alongside Pele 1.9.0 in Chromium. It separates new instances,
unchanged calls, source updates and first use in new processes, and retains
painted output and failures. It is not registered in the standard CLI or catalog;
its timing boundaries differ from the Node SVG suites. Generated evidence stays
outside source commits.

## Add a tool

Declare the project and its public bindings in `catalog/mermaid-community.json`. An npm SVG renderer can use the generic adapter:

```json
{
  "id": "owner/tool",
  "roles": ["renderer"],
  "outputs": ["svg"],
  "benchmark": {
    "adapter": "declared",
    "package": "tool-package",
    "version": "1.2.3",
    "outputs": ["svg"],
    "api": { "svg": { "export": "render", "result": "svg" } }
  }
}
```

A reviewed `benchmark.portable` binding can additionally name a public factory
and disposal method; registered package pipelines reuse the community binding
inside the portable Node worker. See [comparison contracts](FAIRNESS.md).

Bindings accept dotted public export paths, an optional JSON `options` argument and an optional returned field. Promises are awaited. Other outputs, source builds, WASM and native tools use their declared adapters. An installed Node CLI can additionally declare `benchmark.cli`: its npm `bin` name, arguments with `{format}`, and outputs. No project gets an implicit local native executable.

## Run the portable kit

The authored family/scaling campaign accepts a built artifact without that project's source checkout:

```sh
node commands.ts build --out /artifacts/trident-kit
node /artifacts/trident-kit/run.mjs --project obsidianmd/pele \
  --artifact-root /artifacts/pele --out /evidence/portable --records /evidence/records \
  --rounds 5 --samples 31 --cold-samples 20 --allow-partial
```

Copy the whole generated directory, including its manifest. It requires Node 24, the actual renderer artifact and the pinned oracle install; no Bun, Git or Trident `node_modules` is needed at runtime. Set `MERMAID_REFERENCE_DIR` for a nondefault install. `--allow-partial` permits incomplete diagnostics to produce a report; it does not turn them into a calibrated pass. See [portable methods](BENCHMARKS.md) and [comparison contracts](FAIRNESS.md).

## Development and ownership

`bun commands.ts test`, `typecheck` and `lint` check all of Trident. Tests need
the pinned oracle. Optional browser tests use `AM_BROWSER_TESTS=1` and
`AM_CHROMIUM_EXECUTABLE=/path/to/chromium` (legacy environment variable names).

Use `bun commands.ts bench --projects OWNER/TOOL,... --profile full --rounds 5
--out /evidence/full` for all applicable public-artifact suites. `bench --list`
lists suites and selected projects without collecting measurements. Adapter gaps,
setup failures and unsupported surfaces stay visible in the campaign report.

Product source tests, editor experiments, AM release budgets, private operation
witnesses and the AM build/pack Dave wrapper live in
[Agentic Mermaid](https://github.com/adewale/agentic-mermaid/tree/main/eval/benchmark).
Trident has no AM source launcher, workspace assembler or implicit local candidate.
AM uses a pinned Trident library for shared observers and measurement utilities.

Trident originated in Agentic Mermaid; its maintainer maintains both. The
[frozen corpus](corpus/community-corpus.json) records that origin and imported
Mermaid inputs. This public development material is not an independent holdout.
