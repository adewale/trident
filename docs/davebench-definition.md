# DaveBench definition

DaveBench measures how many Mermaid documentation examples each renderer completes and how long the render calls take, separately for SVG, PNG and terminal text. It does not assess drawing correctness or retain rendered outputs. Use `davebench` for SVG/PNG and `davebench:terminal` for native terminal text. See the [three-benchmark portfolio](benchmark-portfolio.md).

## Inputs

Use every Markdown fenced block labelled `mermaid` or `mermaid-example`, recursively under [`mermaid-js/mermaid/docs`](https://github.com/mermaid-js/mermaid/tree/develop/docs). Keep repeated occurrences and original source text. A Mermaid fence shown inside a larger example code fence is not a separate block. HTML and JavaScript usage examples are outside this extraction rule.

Resolve `develop` once before a campaign and record the commit. Every participant and output format receive the same input list in the same order. Do not omit inputs based on a renderer's support or results.

Count at commit [`370c4af57f43cb0bda05f4a9fe2d99c912ba16dd`](https://github.com/mermaid-js/mermaid/tree/370c4af57f43cb0bda05f4a9fe2d99c912ba16dd/docs):

| Directory | Block occurrences | Markdown files containing blocks |
|---|---:|---:|
| `docs/` recursively | 1,342 | 49 |
| `docs/syntax/` only | 1,239 | 34 |

The full `docs/` population contains 673 `mermaid` blocks and 669 `mermaid-example` blocks. These often contain duplicate source; duplicates remain separate attempts.

The [numeric count and per-file breakdown](evidence/davebench-docs-count-2026-11-02.json) record the extraction result. No renderer was invoked for this count.

Dave's reported 1,095 is reproduced by counting the generated `docs/syntax/` directory at our older pin, `1fb7869866dd619168d840291c9c54b4f129758b`: 547 `mermaid` blocks and 548 `mermaid-example` blocks across 34 files. Our former 548-occurrence corpus used `packages/mermaid/src/docs/syntax/`, before documentation generation duplicated many examples.

The new DaveBench uses the full `docs/` population specified above: **1,342 attempts per renderer, format and run** at this revision.

## Execution and timing

Before preparation, resolve current stable releases and freeze their versions.
The command writes `versions.json` and refuses a supplied preparation containing
older versions, source revisions or pipeline companions. If a native rendering
release is newer than its SDK, use that newer release and declare the CLI timing
boundary; do not fall back silently to the older SDK. Version discovery and
artifact preparation are outside all timed calls. See the [current version
audit](benchmark-versions-2026-11-02.md).

1. Initialize the selected renderer. For browser comparisons, use one fixed Chromium environment and run participants sequentially.
2. Warm up each renderer/output path with the same first 30 inputs before each run. Exclude warm-up calls from result counts and timing.
3. Attempt every input sequentially and independently for each applicable format: SVG, PNG and terminal text. Run each format three times. Use the same declared timeout for all participants; timeout calls count as failures.
4. Measure elapsed time around each awaited render/export operation with a monotonic clock. Include failed-call time. Stop the clock on completion or failure. Initialization, warm-up, reporting and subsequent cleanup are outside the clock.
5. Count a render as completed when the operation finishes without reporting an error. Count explicit errors, rejected calls and timeouts as failures. Do not inspect returned drawing contents. Discard returned output after stopping the timer; do not save it.

For **SVG**, completion means the public SVG render operation has completed. For **PNG**, completion means encoded PNG output has been returned: a native PNG export, or SVG rendering followed by a shared SVG-to-PNG conversion. Include conversion and encoding in PNG time and record which path was used. Do not substitute SVG-call time for PNG-export time.

For **terminal text**, completion means the native terminal-rendering operation has completed. Measure its Unicode/ASCII/ANSI text path directly; do not rasterize it. Record persistent API/worker versus fresh-process CLI invocation boundaries. Discard text after the call, just as SVG and PNG output are discarded.

Run terminal collection with `bun commands.ts davebench:terminal --prepared FILE --out FRESH_DIRECTORY`. It checks the current selected artifacts before collecting. A campaign can supply its previously resolved `--catalog FROZEN_CAMPAIGN_CATALOG` to keep all formats at one version cutoff. Published JavaScript runs in Node; packages declaring Bun or TypeScript source run in Bun; Python uses a persistent Python process. Timing occurs inside the worker around the awaited API, excluding IPC. Public CLI clocks include startup and drain/discard their output. OpenTUI host nodes are removed between cases outside the timer.

## Results

Publish a separate stack-ranked table for SVG, PNG and terminal text:

1. **More completed examples is better.** Use the minimum completion count observed across the three complete runs. This rewards handling more of the fixed documentation workload consistently.
2. **For equal completion counts, less time is better.** Use the median total render/export time across those runs. This rewards spending less time on the same full attempted workload at the same completion count.
3. Exact ties share a rank. Incomplete collections and blocked projects remain unranked. Different renderer versions or invocation boundaries cannot be pooled into one three-run result.

The ranking covers each declared public execution path. Native CLI times include per-example process startup; browser API times use initialized runtimes. Show the path beside each score so the measured integration cost is explicit. Completion follows API success; outputs are not assessed.

Keep one small result row per renderer, output format and run:

| Renderer/version | Format | Run | Attempted | Completed | Failed | Total render/export time |
|---|---|---:|---:|---:|---:|---:|
| … | SVG, PNG or terminal text | 1–3 | 1,342 | … | … | … ms |

Total time is the sum of measured call times over every attempted input, including failed calls. Show all three runs and summarize their total times with the median. Keep completion counts alongside timing; faster failures do not establish faster rendering of the same completed work.

The runner writes the rule and rankings to `results.json` and a readable `rankings.md`. Rank before rounding displayed times. There is no weighted combination of completion and speed, and no combined rank across output formats.

Retain source revision, extraction rule, renderer versions, invocation/conversion path, environment, timeout and numeric results. No SVGs, PNGs, terminal outputs, output hashes, output sizes or drawing judgments are needed.

Run this benchmark with `bun commands.ts davebench --out FRESH_DIRECTORY`. It uses a separate counter-and-timer runner; it does not invoke the older drawing-assessment collectors. `--prepared FILE` reuses installed public artifacts, and `--projects OWNER/PROJECT,...` selects participants. Native CLI PNG exports use the declared stdout binding where supported (including Merman), or a discard destination. Stdout goes directly to a discard device, allowing native exporters to reopen it without a socket-backed pipe. Encoded output is discarded without retaining an image file.
