# Standard collectors with native Flutter

`standard-campaign.ts` invokes the existing Mermaid Compatibility, official-docs
SVG-return and Diagram Meaning collectors. It selects mermaid_flutter 0.3.2 as
native Flutter PNG and Pele 1.9.0 as Chromium SVG. Its explicit runtime catalog
replaces the legacy Dart/JavaScript SVG binding for this investigation; the
repository catalog and renderer implementations are unchanged.

Use the [dated scorecards](../docs/native-flutter-standard-benchmarks.md) for
coverage, outcomes, cost boundaries and evidence. The original widget/DOM
entrypoint campaign remains a separate protocol.

## Reproduce

Install the Linux prerequisites in [README.md](README.md), Node 24+, Bun 1.4+,
Flutter 3.47.8 and Chromium. Use a private display with software graphics to match
the retained machine. The retained environment and bundle hashes are in the
evidence archive; changing SDK, fonts or graphics can change results.

From a clean Trident checkout:

```sh
bun install --frozen-lockfile
(cd native-flutter && npm ci)
node commands.ts mermaid:install --dir ../mermaid-reference
# Supply the pinned upstream source checkout separately from the installed oracle:
git clone https://github.com/mermaid-js/mermaid.git ../mermaid
git -C ../mermaid checkout 1fb7869866dd619168d840291c9c54b4f129758b
(cd native-flutter/app && flutter pub get --enforce-lockfile && \
  flutter build linux --release --target lib/community_worker.dart)
```

The release worker target is different from `main.dart`, which belongs to the
widget campaign. Building the wrong target will not implement the standard
JSONL job protocol. Preserve the complete release bundle, including its data
and shared libraries.

Start Xvfb in another terminal, or use an existing desktop display:

```sh
Xvfb :99 -screen 0 1000x700x24 -ac -noreset -nolisten unix -listen tcp
```

Then run all applicable standard collectors, using a new output directory:

```sh
export DISPLAY=127.0.0.1:99 LIBGL_ALWAYS_SOFTWARE=1
export MERMAID_SOURCE_DIR="$PWD/../mermaid"
export MERMAID_REFERENCE_DIR="$PWD/../mermaid-reference"
export FLUTTER_COMMUNITY_BUNDLE="$PWD/native-flutter/app/build/linux/x64/release/bundle"
bun native-flutter/standard-campaign.ts /path/to/fresh-standard-run
python3 native-flutter/standard-report.py /path/to/fresh-standard-run \
  /path/to/fresh-reduction
bun commands.ts results:campaign --campaign /path/to/fresh-standard-run \
  --out /path/to/fresh-publication --copy-evidence
```

Do not run builds, tests or another benchmark concurrently with timing collection.
The driver pins the executable to the sealed bundle. Each native launch records
its executable and `libapp.so` hashes. `CHROMIUM_EXECUTABLE` overrides the default
`/usr/bin/chromium`. `FLUTTER_COMMUNITY_EXECUTABLE`, if set, must name that bundle's
`native_bench`. `STANDARD_SUITES=community,docs,fidelity` and `STANDARD_PROJECTS`
can narrow a diagnostic run; print those selections with its results.

## Contracts

The full profile has five core rounds and one feature-coverage pass. Native API
clocks await `renderToPng(source,pixelRatio:1)`, including rasterization/readback/
PNG production inside that public API. They exclude process launch, file writes
and subsequent qualification. Native repeats use five batch means, at least 10 ms
per batch or at most 256 calls, following the external worker job. Actual call
counts are retained. The first and final PNG are qualified outside the clocks. A per-case acknowledgement
barrier prevents parent PNG decoding from overlapping the next API clock;
intermediate repeated outputs are consumed but not independently qualified.

Chromium uses the standard browser collector's three batch means after calibration
to 20 ms or 256 iterations. Its SVG-return clock excludes subsequent qualification.
Neither clock represents source updates, widget frames or physical presentation.
The six core cases are diagnostics and have no A/A performance calibration here.

PNG qualification checks decoded raster content within a 16-megapixel observer
budget. It does not establish label retention or diagram meaning. SVG qualification
checks XML/canvas and authored labels where declared. Missing labels can reflect
label-culling or quoting policies; retain the finding rather than automatically
calling it a rendering defect. Unsupported family probes cause related cases to
be skipped under the standard policy; those cases are not individually invoked.

The docs collector checks only returned SVG-looking strings. Diagram Meaning
uses its existing authored SVG/paint criteria and optional model mappings. Native
PNG and widget entrypoints cannot earn SVG or model passes. The portable benchmark
requires Node SVG; model fidelity requires reviewed model bindings. Those contracts
do not provide a native Flutter/Chromium performance comparison.

`standard-report.py` reads the owning inventories and observations without changing
them. It emits per-input dispositions, all nonpasses with source, core timing
samples and a summary. The normal `results:campaign` publisher additionally retains
surface/mode/round scorecards. Preserve the complete run: JSON references may point
to adjacent compressed payloads, and raw absolute paths remain provenance after
moving an archive. Collection can complete while qualification fails.

For the dated publication, compatibility was rerun separately with
`STANDARD_SUITES=community` after the acknowledgement fix; docs and Meaning retain
their unaffected earlier owning run. The reducer accepts that earlier run as an
optional third argument. Publish both with explicit suite selections:

```sh
python3 native-flutter/standard-report.py /evidence/community-run \
  /evidence/fresh-reduction /evidence/measured-run
bun commands.ts results:campaign \
  --campaign /evidence/community-run --suites community \
  --campaign /evidence/measured-run --suites docs,fidelity \
  --out /evidence/fresh-publication --copy-evidence
```
