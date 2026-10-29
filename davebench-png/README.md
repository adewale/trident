# DaveBench PNG export

> V1 timings are withdrawn as comparative evidence. Use the [controlled PNG profile](controlled/README.md) for the replacement contract. This guide reproduces the retained v1 diagnostic.

This is a PNG extension of Trident's existing official-documentation SVG-return
collector. It reuses `docsInventory()`: all 548 occurrences (546 distinct trimmed
sources) from the 34 pinned Mermaid 12.2.0 syntax pages, including examples a
participant rejects. It does not replace DaveBench's SVG protocol.

The default run has five rounds. Each participant gets a new worker/page per
round, 30 warmup attempts on the first 30 sources, then one PNG export per
occurrence in documentation order. Participant order rotates/reverses between
rounds; execution is sequential on one machine. Warmup errors are retained.

| Published package | Version | Measured work |
|---|---|---|
| agentic-mermaid | 0.4.1 | Node `renderMermaidPNG(source,{scale:1})` |
| mermaid | 12.2.0 | Chromium `render()` plus SVG preparation/decode, canvas draw and PNG production |
| mermaid_flutter / mermaid_core | 0.3.2 | Native Linux Flutter release `renderToPng(source,pixelRatio:1)` |
| pele | 1.9.0 | Chromium `render()` plus the same SVG-to-PNG path as Mermaid |

Mermaid loads its pinned first-party ZenUML addon 1.0.1. Other participants'
unsupported inputs remain results. Agentic runs in Node, not the browser; its
published native PNG path has a different rasterizer from Chromium and Flutter.

## Reproduce

Install Node 24+, Bun 1.4+, Chromium and the native Flutter/Linux dependencies in
[the native guide](../native-flutter/README.md). Use Flutter 3.47.8 / Dart 3.13.7
for the measured environment. From Trident:

```sh
bun install --frozen-lockfile
(cd davebench-png && npm ci --ignore-scripts)
node commands.ts mermaid:install --dir ../mermaid-reference
# ../mermaid must be a clean checkout of the mermaid@12.2.0 release:
git -C ../mermaid checkout 1fb7869866dd619168d840291c9c54b4f129758b
(cd native-flutter/app && flutter pub get --enforce-lockfile && \
  flutter build linux --release --target lib/community_worker.dart)
```

Start a private display, or use an existing desktop session:

```sh
Xvfb :99 -screen 0 1000x700x24 -ac -noreset -nolisten unix -listen tcp
```

In another terminal:

```sh
export DISPLAY=127.0.0.1:99 LIBGL_ALWAYS_SOFTWARE=1
export MERMAID_SOURCE_DIR="$PWD/../mermaid"
export MERMAID_REFERENCE_DIR="$PWD/../mermaid-reference"
bun commands.ts docs:png --out /path/to/fresh-run
```

`--native-bundle DIR` selects a complete release bundle; its executable and every
bundle file are sealed, and launch receipts are checked. `--packages DIR`
selects installed packages, still subject to exact version checks. `--rounds N`
changes sampling. `--limit N` is an explicitly labelled preflight, never a full
published run. Normal collection requires committed measurement producers. Do
not run tests, builds or other benchmarks concurrently with collection.

## Meaning of the result

The total clock ends after encoded bytes are available and consumed. It excludes
startup/import, transport, PNG qualification and file writes. Native and Agentic
PNG APIs expose combined costs; no synthetic internal stage split is reported.
Browser PNG production includes any deferred rasterization/readback plus encoding;
its canvas-draw clock alone is not completed raster work.

Each output uses intrinsic bounds at scale1, default layout/fonts/themes and the
API's artifact/default background. Browser conversion uses a white backdrop and
an explicit canvas matching the SVG viewBox. SVG foreignObject markup is serialized
through the browser DOM; labels are not stripped. This preparation is timed.
Output dimensions, bytes and per-case stages are retained. This is a practical
export comparison, not equal-pixel throughput or matched visual quality.

Qualification decodes the actual PNG and requires nonuniform visible content.
It establishes neither label retention nor topology. Uniform/blank outputs are
failures; observer-budget limits are blocked and remain distinct from API/export
failures. The observer allows 16Mi pixels, 64MiB encoded and 256MiB decoded bytes.
The browser conversion also has a declared 16,384-pixel-per-dimension/64Mi-pixel
raster limit. Validation finishes before the next timed call, including a native
acknowledgement barrier. No external browser asset network is permitted.

Retain the whole output directory: raw worker jobs/rows, PNGs, SVGs, errors,
inventory, package/bundle byte manifests, environment, warmups and completion.
A completed collection is not a qualification pass. Compare timings on common
qualified inputs alongside full coverage, with dimensions and runtime shown.
There is no A/A calibration, cold-start claim, source-update workload or production
holdout in this simple extension.
