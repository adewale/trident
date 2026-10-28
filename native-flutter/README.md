# Native Flutter and Chromium entrypoint campaign

This standalone Trident campaign measures `mermaid_flutter` **0.3.2** in a native
Linux Flutter release application and Pele **1.9.0** in Chromium. It does not run
Flutter Web or substitute a Dart/JavaScript core renderer. It is not registered
in Trident's standard CLI or catalog.

The native app calls `MermaidDiagram`, `MermaidView` and `renderToPng()` directly.
The browser harness calls `render()` followed by DOM insertion, and
`mount()`/`Mounted.update()`. Both run sequentially on one machine.

## Run

Install Node 24+, Python 3.10+, Flutter with Linux desktop artifacts, Chromium,
clang, cmake, ninja-build, pkg-config and GTK 3 development libraries. Image
inspection also needs Python Pillow and Tesseract. The retained campaign used
Flutter 3.47.8 / Dart 3.13.7, Chromium 154.0.8037.57, Xvfb and software graphics;
use its environment receipt and font hashes when reproducing those exact pixels.

```sh
cd native-flutter
npm ci
# Use an existing desktop display, or start a private Xvfb display:
Xvfb :99 -screen 0 1000x700x24 -ac -nolisten unix -listen tcp
# In another shell:
export DISPLAY=127.0.0.1:99
./reproduce.sh
```

Use that unauthenticated TCP display only in a private environment. An existing
authenticated display is also supported. `CHROMIUM_EXECUTABLE` selects Chromium
(default `/usr/bin/chromium`). `FLUTTER_ROOT` selects an SDK outside PATH;
`BENCH_SYSROOT` selects optional locally extracted Linux build dependencies.
Normal system installs need neither. `PUB_CACHE`, `XDG_CONFIG_HOME` and
`XDG_CACHE_HOME` can select writable cache directories. `PELE_MODULE` can select
an already installed Pele browser module; it must still be version 1.9.0.

The driver builds a native **release** app, prepares inputs, runs native then
headed Chromium, collects first-use and supplemental edit passes, and produces
CSV/JSONL summaries and representative images. It refuses to reuse existing
sample directories. Move old evidence aside before rerunning.

`prepare.py` selects Trident's six core/scaling fixtures and all 23 registry
fixtures, plus malformed-flowchart and unsupported-ZenUML probes. It freezes
sources, hashes and edits into generated manifests. These are public development
fixtures, not a holdout or a complete Mermaid compatibility test.

Generated evidence belongs outside source commits, as specified in
[Trident's results instructions](../results/README.md). Copy the entire generated
`results/` directory and both case manifests to retain a run. The original dated
campaign and its environment details were supplied separately as an evidence
archive; PR source changes do not replace its measured adapter snapshot.

## Workloads and sampling

The full driver uses three rounds, five measured observations per cell and two
retained warmups per round. Negative sample indices identify warmups. Native
rounds share one process. Browser rounds use a fresh page in one Chromium process.
Inputs, APIs and phases have a fixed order. There is no A/A calibration or
confidence-interval claim; p95 estimates use only 15 measured observations.

- **Fresh:** new widget state, new mounted instance, or emptied render host in an
  initialized runtime. Text/font/graphics caches are retained.
- **Repeat:** unchanged-source widget rebuild, repeated `render(source)` with DOM
  replacement, `Mounted.update(sameSource)`, or another stateless PNG call.
- **Update:** alternating original and edited sources. Pixel hashes record
  whether captured output changes. Failed or invisible edits remain observations.
- **First use:** five new processes per public entrypoint, no warmup and one
  flowchart call per process. Timers exclude launch/import, but deferred font or
  shader initialization can still occur. Never pool these with warmed calls.

The original tree edit changes only its first label declaration; later declarations
overwrite it. That ineffective edit stays in the main manifest. The separately
identified `core:tree50-visible-edit` changes every declaration. Its root can
still be outside a clipped Diagram viewport; the full PNG and fitted View provide
separate evidence. `first-use.sh` collects both supplemental passes.

For a quick invocation check after building, run from this directory:

```sh
ONLY_CASE=core:flow5 ROUNDS=1 SAMPLES=1 WARMUPS=0 \
  OUT="$PWD/results/smoke-native" app/build/linux/x64/release/bundle/native_bench
HEADED=1 ONLY_CASE=core:flow5 ROUNDS=1 SAMPLES=1 WARMUPS=0 \
  OUT="$PWD/results/smoke-browser" node pele.mjs
```

`ONLY_API` and `ONLY_PHASE` can restrict either adapter. Native runs also accept
`BENCH_ROOT` for an input-manifest directory; Chromium accepts `CASES_FILE`.
`validate.py` checks the full driver contract, not these reduced smoke profiles.

## Completion boundaries

Native `ui_frame_ms` stops at `endOfFrame`, which completes the UI pipeline.
View gets a second frame for its default post-frame fit. Neither clock establishes
raster completion. `FrameTiming` supplies separate engine build/raster durations.
`analyze.py` matches build-start timestamps against sample `Timeline.now` intervals;
delayed callback-delivery labels are not used for association. It derives
`raster_complete_ms` as the latest matched `(vsyncStart + totalSpan) - sampleStart`.
This completes engine raster work, not physical display scan-out.

Repaint-boundary `toImage` is a separate 1000×700 capture raster request. Raw RGBA
readback and PNG conversion have separate clocks. Flutter PNG conversion includes
another readback, so it is not labeled isolated encoding. The unmodified public
`renderToPng(pixelRatio:1)` exposes only its combined render/raster/encode duration.
Its PNG decode and validation readback occur outside that API clock.

Pele clocks SVG return separately from DOM insertion. The mount/update clock
includes its public call and DOM work. Two animation-frame callbacks allow a
paint opportunity; they are not proof of compositor presentation. Browser-page
screenshots validate DOM paint independently. Offscreen SVG decode, canvas draw,
raw readback and PNG encoding have separate fields. Canvas draw can defer work
to readback. Intrinsic PNG dimensions, fonts and styling differ between libraries.
There is no equivalent-work basis for an overall cross-runtime speed ratio.

Captures, pixel scans/hashes and file writes occur outside API clocks but influence
sample pacing. Default themes, font fallbacks and View controls remain enabled.
Software graphics does not predict mobile-device/GPU performance.

## Qualification and analysis

A nonblank image establishes painted content, not complete or correct meaning.
Large diagrams may be clipped. Inspect retained images and changed-pixel hashes;
DOM text and OCR are diagnostics, not semantic or visibility oracles. Exceptions,
unsupported inputs and unchanged updates stay in the evidence.

`analyze.py` emits per-case/phase/stage medians, p95, ranges, coverage, failures,
update hashes and joined frame records. `validate.py` checks sample counts,
release mode, positive pixels, negative cases, frame joins and supplemental edits.
`images.py` builds a contact sheet and runs diagnostic OCR after measurement.
Manual visual findings may be saved in `results/visual-findings.json`; analysis
applies those findings only to that inspected run, never automatically to a new run.
