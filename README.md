# Trident

Trident is a tool for benchmarking Mermaid implementations. It is for people
building a Mermaid renderer or parser and for people choosing one.

Mermaid has been reimplemented in Rust, Go, Dart, Python and TypeScript, and the
implementations are far apart: given Mermaid's own documentation examples, the
<!-- fact:davebench-svg-renderers -->16<!-- /fact --> SVG renderers complete
anywhere from <!-- fact:davebench-svg-range -->384 to 1,338<!-- /fact --> of them.
Trident runs <!-- fact:projects -->27<!-- /fact --> implementations, at frozen
versions, through three benchmarks and records every case each one passes or
fails, so a builder can see what to fix and a chooser can see which diagrams will
fail.

## The three benchmarks

Each benchmark answers a question the previous one leaves open.

**[DaveBench](docs/davebench-definition.md): does it render?** DaveBench is
derived from Dave Kiss's posts
([first](https://x.com/davekiss/status/2111512440106078554),
[second](https://x.com/davekiss/status/2111513199119941999)). Trident takes every
Mermaid example in Mermaid's documentation
(<!-- fact:davebench-inputs -->1,342<!-- /fact --> blocks at a pinned commit) and
renders each one three times per format. It counts the renders that produce a
usable output: an SVG with a size, a valid PNG, or terminal text that is not
empty, an error or the source printed back. It ranks by that count, then by
median time. DaveBench never looks at the drawing, so an implementation can
complete an example and still draw it wrong.

**[Drawing Correctness](docs/benchmark-portfolio.md#drawing-correctness-real-rendering-failures-across-formats):
is the drawing right?** There are <!-- fact:drawing-cases -->127<!-- /fact -->
cases, taken from shared examples and from bugs reported against real
implementations. Each case lists the labels its diagram must show. Trident checks
that every label appears in the SVG or terminal output, with no error message or
raw Mermaid syntax. Edges, arrows and layout are not checked, so a drawing can
show every label and still connect them wrongly.

**[Mermaid Fidelity](docs/benchmark-portfolio.md#mermaid-fidelity-execute-pinned-upstream-tests):
does it behave like Mermaid?** Mermaid's
<!-- fact:fidelity-files -->316<!-- /fact --> core test files call Mermaid's parser
and inspect the model it builds, including its edges (`flow-edges.spec.js`, for
example, tests flowchart arrow types). Trident runs those tests unchanged against each
implementation's parser, translating its model into the shape the tests read.
When Trident cannot call an implementation's parser from JavaScript, it reaches
it through a [parser bridge](docs/benchmark-results-details.md#why-coverage-is-incomplete);
13 implementations are reached this way.
Only the <!-- fact:fidelity-population -->3,618<!-- /fact --> tests that Mermaid
<!-- fact:mermaid-reference -->12.2.0<!-- /fact --> itself passes count. If a test needs an operation the implementation
doesn't offer, it counts as a failure. If it reads a field Trident can't
translate yet, it stays unassessed
(<!-- fact:fidelity-gaps -->83<!-- /fact --> tests across all implementations).

Drawing Correctness and Mermaid Fidelity tables show each project's verified rank
and the range of ranks still possible once its unassessed cases are resolved.

## Current results

Collected <!-- fact:campaign-collected -->6 November 2026<!-- /fact -->. The
leaders are:

- **DaveBench**, examples completed. SVG:
  <!-- fact:davebench-svg-leader -->Latias Merman with 1,338<!-- /fact -->. PNG:
  <!-- fact:davebench-png-leader -->Latias Merman with 1,338<!-- /fact -->. Terminal text:
  <!-- fact:davebench-terminal-leader -->Frankenmermaid with 1,342<!-- /fact -->.
- **Drawing Correctness**, cases correct. SVG:
  <!-- fact:drawing-svg-leader -->Bezel, Ondine and Pele with 126 each<!-- /fact -->.
  Terminal text: <!-- fact:drawing-terminal-leader -->Agentic Mermaid with 124<!-- /fact -->.
- **Mermaid Fidelity**, tests passed:
  <!-- fact:fidelity-leader -->Pele with 3,143<!-- /fact -->.

Mermaid is ranked alongside the other implementations in DaveBench and Drawing
Correctness. In Mermaid Fidelity it is the reference, so it passes every counted
test by definition and is left out of the leader above.

[Full league tables, with timings](RESULTS.md) ·
[How each count is made](docs/benchmark-results-details.md) ·
[How the collection was run](results/release/README.md)

## Quick start

This reproduces one row of the DaveBench tables: Ondine's SVG and PNG counts.
Ondine installs from npm and renders the whole corpus in under a minute, which
makes it a quick row to check. It needs Bun 1.4+, Node 24+, git and Chromium (`bunx playwright install chromium`
if you have none). On a Linux container it took about two minutes, downloads
included.

```sh
git clone https://github.com/adewale/trident
git clone https://github.com/mermaid-js/mermaid   # DaveBench reads Mermaid's docs from here
cd trident
bun install --frozen-lockfile
node commands.ts mermaid:install                  # pinned Mermaid reference, in ../mermaid-reference
bun commands.ts versions --projects wevm/ondine --out ../quickstart/versions
bun commands.ts prepare --catalog ../quickstart/versions/catalog.json --projects wevm/ondine --out ../quickstart/artifacts
bun commands.ts davebench --catalog ../quickstart/versions/catalog.json --prepared ../quickstart/artifacts/community-browser-prepared.json --projects wevm/ondine --out ../quickstart/davebench
```

DaveBench renders every example three times per format and prints progress:

```text
wevm/ondine svg run 1/3
  100/1342: 96 completed, 4 failed, 0.05 s
  ...
  done: 1306/1342, 0.352 s
...
wevm/ondine png run 3/3
  done: 1306/1342, 7.803 s
```

It writes `../quickstart/davebench/rankings.md` and `results.json`. The completed
counts should match Ondine's rows in [RESULTS.md](RESULTS.md); the times depend
on your machine and compare only with rows collected on the same machine.

## Install

A full campaign needs more than the quick start:

- Bun 1.4+, Node 24+, npm, git and Python 3.12.
- Chromium for browser renderers. Trident uses `TRIDENT_CHROMIUM_EXECUTABLE` when it
  is set, then `/usr/bin/chromium`, then Playwright's Chromium.
- Tesseract and the Python packages in `fidelity/drawing/requirements.txt`, for
  Drawing Correctness.
- The toolchains that compiled projects declare in the catalog.
- A Mermaid checkout at `../mermaid`, checked out at the tag of the pinned Mermaid
  reference (Mermaid <!-- fact:mermaid-reference -->12.2.0<!-- /fact -->).
  DaveBench reads its pinned docs commit from the history, and Mermaid Fidelity
  runs the tag's tests.

```sh
bun install --frozen-lockfile
node commands.ts mermaid:install
bunx playwright install chromium
python -m pip install -r fidelity/drawing/requirements.txt
git -C ../mermaid checkout mermaid@12.3.0
bun commands.ts upstream:prepare --runtime ../fidelity-runtime
node commands.ts --version
```

`upstream:prepare` builds the test runtime for Mermaid Fidelity from the clean
tag checkout ([runtime notes](docs/upstream-original-runtime.md)). The native
Mermaid Flutter PNG counter is built separately ([build guide](native-flutter/README.md)).
Campaigns have been collected on Linux x64; CI tests Trident itself on Linux and
macOS.

## Run a full campaign

```sh
bun commands.ts versions --out FRESH_VERSIONS
bun commands.ts prepare --catalog FRESH_VERSIONS/catalog.json --out FRESH_ARTIFACTS
bun commands.ts davebench --catalog FRESH_VERSIONS/catalog.json --prepared FRESH_ARTIFACTS/community-browser-prepared.json --out FRESH_IMAGES
bun commands.ts davebench:terminal --catalog FRESH_VERSIONS/catalog.json --prepared FRESH_ARTIFACTS/community-prepared.json --out FRESH_TERMINAL
bun commands.ts davebench:native-png --host-display --bundle native-flutter/app/build/linux/x64/release/bundle --out FRESH_FLUTTER
bun commands.ts drawing:correctness --prepared FRESH_ARTIFACTS/community-browser-prepared.json --terminal-prepared FRESH_ARTIFACTS/community-prepared.json --catalog FRESH_VERSIONS/catalog.json --out FRESH_DRAWINGS
bun commands.ts mermaid:fidelity --upstream PINNED_MERMAID --reference MERMAID_REFERENCE --runtime VITEST_RUNTIME --prepared FRESH_ARTIFACTS/community-prepared.json --catalog FRESH_VERSIONS/catalog.json --out FRESH_FIDELITY
bun commands.ts campaign:results --images FRESH_IMAGES/results.json --terminal FRESH_TERMINAL/results.json --native-png FRESH_FLUTTER/results.json --out FRESH_REPORT
```

| Placeholder | Meaning |
|---|---|
| `FRESH_*` | A directory that does not exist yet |
| `PINNED_MERMAID` | The Mermaid checkout at the pinned reference's tag (`../mermaid`) |
| `MERMAID_REFERENCE` | The reference installed by `mermaid:install` (`../mermaid-reference`) |
| `VITEST_RUNTIME` | The `--runtime` directory built by `upstream:prepare` |

`versions` freezes the latest public release of every project and `prepare`
installs them, so nothing is installed while a benchmark is being timed. With
`--since` and a published campaign's catalog, `versions` lists the projects that
have released since, which shows whether a new collection is worth running.
`prepare` writes two lists, one of browser-ready image artifacts and one of every
artifact. Pass them unchanged, because each collector takes only the projects
that declare its output format. Mermaid Flutter has no prepared artifact, so
`davebench:native-png` measures its release bundle instead, and
`campaign:results --native-png` adds those runs to the image results. It writes
the merged `images.json` beside the DaveBench rankings, which it builds from
existing numbers without launching a renderer. Every command takes
`--help`.

The [equal-weight overall synthesis](docs/overall-scoring.md) shows each
project's score range and possible rank. Exact overall scores wait for complete
coverage, because missing work is never counted as zero.
[Reading the results](REPORTING.md) explains the tables.

## Supported projects

Campaigns select 27 renderers: 16 with SVG output, ten terminal-only
implementations and the native Mermaid Flutter PNG renderer. The table names the
outputs a project's public interface has produced; it does not certify every
diagram family.

| SVG-rendering project | Outputs exercised successfully |
|---|---|
| [Agentic Mermaid](https://github.com/adewale/agentic-mermaid) | SVG, terminal, PNG, parser |
| [Beautiful Mermaid](https://github.com/lukilabs/beautiful-mermaid) | SVG, terminal |
| [Bezel](https://github.com/crabtalk/bezel) | SVG |
| [Crafter Mermaid](https://github.com/crafter-station/mermaid) | Browser DOM SVG, parser; raw Node SVG has a retained XML failure |
| [DSH Mermaid GB SVG](https://github.com/sandyyst/dsh-plugin-mermaid-gb-svg) | SVG (flowcharts only) |
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
PNG interface built on Mermaid Dart's parser and layout core.

The [catalog](CATALOG.md) lists all 89 projects considered, with their ancestry
and the reason each of the other 62 is excluded; parser-only and validator-only
tools, for example, are not renderers.

[![Lineage of all 27 scheduled renderers with a legend: blue for SVG, green for terminal-only, purple for native PNG, solid arrows for project lineage and a dashed arrow for the ASCII component port.](docs/images/lineage.png)](docs/images/lineage.png)

Solid arrows are recorded forks, derivatives, ports and native-renderer
relationships; the dashed arrow is Beautiful Mermaid's ASCII component port.
Position in the figure is not a rank. The [full tree](LINEAGE.md) includes every
exclusion, and [the rendering notes](docs/lineage-rendering.md) explain how the
figure was made.

## Add an implementation

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

## Limitations

- The maintainer of Trident also maintains Agentic Mermaid, one of the
  implementations ranked here, and Trident began inside that project. Agentic
  Mermaid's own product tests live in
  [its repository](https://github.com/adewale/agentic-mermaid/tree/main/eval/benchmark),
  not here. The [frozen corpus](corpus/community-corpus.json) is public
  development material, not an independent holdout.
- No benchmark checks layout. DaveBench does not look at the drawing, Drawing
  Correctness checks only labels, and Mermaid Fidelity reaches only what an
  implementation's parser exposes.
- DaveBench times compare only with rows from the same collection on the same
  machine.
- Benchmarks run locally. CI tests Trident's code and refuses to run any
  benchmark.

## Development

`bun commands.ts test` runs the full local suite and needs the pinned reference.
CI runs `lint`, `typecheck`, `results:snapshot --check` and `test:ci` (every
`tests/*.test.ts` except the reviewed exclusions in `tests/ci-skip.json`) without
project artifacts or a reference, and runs `test:ci` again on macOS. CI also
rejects tracked files over 2 MB unless `tests/large-files.json` lists them with a
reason. Browser tests and benchmarks use `TRIDENT_CHROMIUM_EXECUTABLE` when it is
set, then `/usr/bin/chromium`, then Playwright's Chromium; CI sets it to Playwright's.

Numbers quoted in the docs are generated: `bun commands.ts results:snapshot`
fills each `<!-- fact:NAME -->` marker from the result files, and CI fails when
one drifts. [CONTRIBUTING.md](CONTRIBUTING.md) describes how benchmark work is run and
recorded; [SCOPE.md](SCOPE.md) sets the development scope, and the
[release notes](CHANGELOG.md) list changes by version.

## License and support

MIT; see [LICENSE](LICENSE). Report problems and ask questions in
[GitHub issues](https://github.com/adewale/trident/issues).
