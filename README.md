# Trident

Trident benchmarks Mermaid implementations on three questions:

| Benchmark | Measures | Status |
|---|---|---|
| **DaveBench** | Completed documentation renders and elapsed time, separately for SVG, PNG and terminal text. A completion needs a usable output: a sized SVG, a valid PNG, or terminal text that is not empty, an error message or the source printed back. | Implemented. [Results](RESULTS.md#davebench); [campaign evidence](results/release/README.md). |
| **Drawing Correctness** | Every expected label shown, without errors or raw syntax, on a shared corpus of examples and real project regressions; SVG and terminal text. | Implemented: <!-- fact:drawing-cases -->127<!-- /fact --> shared cases; <!-- fact:drawing-unassessed -->0<!-- /fact --> of <!-- fact:drawing-rows -->4,318<!-- /fact --> results unassessed (collected <!-- fact:drawing-collected -->5 November 2026<!-- /fact -->). Edges and layout are not checked. |
| **Mermaid Fidelity** | Original assertions from the full pinned Mermaid test inventory, through candidate adapters, scored over the tests pinned Mermaid itself passes. | Implemented: all <!-- fact:fidelity-candidates -->26<!-- /fact --> candidates attempted all <!-- fact:fidelity-files -->316<!-- /fact --> core-package test files against <!-- fact:fidelity-population -->3,618<!-- /fact --> tests Mermaid passes (collected <!-- fact:fidelity-collected -->5 November 2026<!-- /fact -->); <!-- fact:fidelity-gaps -->94<!-- /fact --> candidate tests remain unassessed by Trident. 13 candidates are reached through [parser bridges](docs/benchmark-results-details.md#why-coverage-is-incomplete) and reviewed schema views. Operations a candidate does not offer are known nonpasses; fields no view maps remain unassessed. |

[League tables](RESULTS.md) · [Methods and coverage](docs/benchmark-results-details.md) · [Definitions and corpus requirements](docs/benchmark-portfolio.md) · [DaveBench method](docs/davebench-definition.md)

## Work on the benchmarks

The collectors reuse existing readers, drivers and checks. The remaining work
is reducing observed assessment and adapter gaps. Freeze versions once per campaign,
check the changed invocation on a few known cases, then run the affected workload.
Record a blocked project and continue with the others.

During development, run affected tests. Full timing repeats belong after the
invocation works. A report needs the actual results and a readable table; extra
manifests, duplicate archives and publication checks are optional release work.
DaveBench keeps counts and times, discarding rendered outputs. No benchmark keeps a
raw-output archive: a result is verified by re-running its frozen versions and pinned
inputs ([evidence rule](docs/benchmark-results-details.md#evidence-and-verification)).
Missing results stay explicit.

```sh
bun commands.ts versions --out FRESH_VERSIONS
bun commands.ts prepare --catalog FRESH_VERSIONS/catalog.json --out FRESH_ARTIFACTS
bun commands.ts davebench --catalog FRESH_VERSIONS/catalog.json --prepared IMAGE_ARTIFACTS --out FRESH_IMAGES
bun commands.ts davebench:terminal --catalog FRESH_VERSIONS/catalog.json --prepared TERMINAL_ARTIFACTS --out FRESH_TERMINAL
bun commands.ts drawing:correctness --prepared IMAGE_ARTIFACTS --terminal-prepared TERMINAL_ARTIFACTS --catalog FROZEN_CATALOG --out FRESH_DRAWINGS
bun commands.ts mermaid:fidelity --upstream PINNED_MERMAID --reference MERMAID_RUNTIME --runtime VITEST_RUNTIME --prepared ALL_ARTIFACTS --catalog FROZEN_CATALOG --out FRESH_FIDELITY
bun commands.ts campaign:results --images FRESH_IMAGES/results.json --terminal FRESH_TERMINAL/results.json --out FRESH_REPORT
```

Prepared artifact lists identify installed public releases. `prepare` installs the
frozen versions and writes `community-browser-prepared.json` (browser-ready image
artifacts) and `community-prepared.json` (every artifact); `davebench` without
`--prepared` prepares its image artifacts itself. Setup happens before timing. The report reads existing numbers and launches no renderers. Equal-weight
[overall synthesis](docs/overall-scoring.md) shows score ranges and each project's
possible rank; exact overall scores await complete coverage, and missing work is
never counted as zero.

[Reading the results](REPORTING.md) · [Catalog](CATALOG.md) · [Development scope](SCOPE.md) · [Release notes](CHANGELOG.md)

## Supported projects

Normal campaigns select **27 renderers**: 16 with SVG output, ten terminal-only
implementations and the native Mermaid Flutter PNG renderer. The table names the
outputs a project's public interface has produced; it does not certify every family.

| SVG-rendering project | Outputs exercised successfully |
|---|---|
| [Agentic Mermaid](https://github.com/adewale/agentic-mermaid) | SVG, terminal, PNG, parser |
| [Beautiful Mermaid](https://github.com/lukilabs/beautiful-mermaid) | SVG, terminal |
| [Bezel](https://github.com/crabtalk/bezel) | SVG |
| [Crafter Mermaid](https://github.com/crafter-station/mermaid) | Browser DOM SVG, parser; raw Node SVG has a retained XML failure |
| [DSH Mermaid GB SVG](https://github.com/sandyyst/dsh-plugin-mermaid-gb-svg) | SVG |
| [Frankenmermaid](https://github.com/Dicklesworthstone/frankenmermaid) | SVG, parser, diagnostics |
| [Latias Merman](https://github.com/Latias94/merman) | SVG |
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
[Figurehead](https://github.com/Mootikins/figurehead-rs), [Grok's renderer component](https://github.com/xai-org/grok-build),
[Kitlangton Merman](https://github.com/kitlangton/merman), [Loom's renderer component](https://github.com/Yassimba/loom),
[Mermaid ASCII](https://github.com/AlexanderGrooff/mermaid-ascii),
[MermaidText](https://github.com/spacedock-dev/mermaidtext), [MermaidTUI](https://github.com/tariqshams/mermaidtui),
[OpenCode's Merman component](https://github.com/anomalyco/opencode)
and [Termaid](https://github.com/fasouto/termaid).

[Mermaid Flutter](https://pub.dev/packages/mermaid_flutter) has a separate native
PNG interface using Mermaid Dart's parser/layout core. DSH Mermaid GB SVG is a
flowchart specialist. Parser, model and invalid-input checks of enrolled renderers
remain in scope; validator-only tools do not enter renderer comparisons.

The [catalogue](CATALOG.md) retains all 89 identities and their ancestry.
**62 are excluded** by renderer scope, explicit project selection, branding,
application or binding policy. MDV, OpenCode Merman, TUI Mermaid, Lovely Mermaid
and Mermansi are catalogue-only. So are the seven parser/validator/formatter/converter
entries removed from the earlier 39-project selection. Rusty Mermaid declares
only diagnostics and is also outside renderer scope; its broken-release receipt
remains recorded. These exclusions apply before acquisition and cannot be enabled
with the descendant-investigation override. Historical receipts retain their
original project selections and dates.

## Project lineage

[![Lineage of all 27 scheduled renderers with a legend: blue for SVG, green for terminal-only, purple for native PNG, solid arrows for project lineage and a dashed arrow for the ASCII component port.](docs/images/lineage.png)](docs/images/lineage.png)

Every scheduled renderer appears once. Node labels show configured rendering
output checks, including interfaces that may fail or remain blocked. They do not
assert successful output or qualified performance. The image's legend explains
the output colours, grey groups and arrow styles. Solid arrows label recorded
forks, derivatives, ports or native-renderer relationships; the dashed arrow marks
only Beautiful Mermaid's ASCII component port. Unconnected renderers are grouped
without inventing ancestry. Mermaid Dart and Mermaid Flutter remain distinct brands.

The [Mermaid source](docs/lineage-overview.mmd) was generated from the catalog
selection and rendered by Agentic Mermaid with Publication Figure and Nord Light,
with the legend added below the graph and bundled Inter fonts.
[The font and style comparison](docs/lineage-rendering.md) explains the rendering choices;
the [SVG download](docs/images/lineage.svg) retains live text.
[The receipt](docs/images/lineage.json) records the renderer version, selected projects and hashes;
[the full catalogue tree](LINEAGE.md) includes every exclusion. Appearance implies
no benchmark rank.

## Install

Install Bun 1.4+, Node 24+, npm, Python 3.12 and the package dependencies. The
Mermaid reference is pinned Mermaid 12.2.0 with its parser and first-party ZenUML
addon. Browser renderers need Chromium; compiled projects need their declared
toolchains. Drawing Correctness also needs Tesseract and the Python packages in
`fidelity/drawing/requirements.txt`.

```sh
bun install --frozen-lockfile
node commands.ts mermaid:install
bunx playwright install chromium
python -m pip install -r fidelity/drawing/requirements.txt
node commands.ts --version
```

Mermaid Fidelity also needs a checkout of the pinned Mermaid source and its test
runtime, built with `bun commands.ts upstream:prepare` ([runtime notes](docs/upstream-original-runtime.md)).
The native Mermaid Flutter PNG counter is built separately ([native Flutter](native-flutter/README.md)).
No public release has been published; see the [release notes](CHANGELOG.md).

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

Bindings accept dotted public export paths, an optional JSON `options` argument and an optional returned field. Promises are awaited. Other outputs, source builds, WASM and native tools use their declared adapters. An installed Node CLI can additionally declare `benchmark.cli`: its npm `bin` name, arguments with `{format}`, and outputs. No project gets an implicit local native executable.

## Development and ownership

`bun commands.ts test` runs the full local suite and needs the pinned oracle.
CI runs `lint`, `typecheck`, `results:snapshot --check` and `test:ci` (every
`tests/*.test.ts` except the reviewed exclusions in `tests/ci-skip.json`) without
project artifacts or an oracle, and runs `test:ci` again on macOS, whose temporary
folders are symlinks. CI also rejects tracked files over 2 MB unless
`tests/large-files.json` lists them with a reason. Artifact preparation and every
benchmark are local operations; Trident refuses to run them in CI.
Optional browser tests use `AM_BROWSER_TESTS=1` and
`AM_CHROMIUM_EXECUTABLE=/path/to/chromium` (legacy environment variable names).

Product source tests, editor experiments and release budgets live in
[Agentic Mermaid](https://github.com/adewale/agentic-mermaid/tree/main/eval/benchmark).
Trident has no product source launcher, workspace assembler or implicit local candidate.

Trident originated in Agentic Mermaid; its maintainer maintains both. The
[frozen corpus](corpus/community-corpus.json) records that origin and imported
Mermaid inputs. This public development material is not an independent holdout.
