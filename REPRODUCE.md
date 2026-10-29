# Reproduce the seven-implementation PNG campaign

The timing source is `f2045b56b662231b9432937c8ed2201f0c5efb06` in adewale/trident. Coverage uses `bd8e9b3fe933e4a9262dace5dd3d86700b12aa0f`, which resolves the published Mermaid ZenUML addon's browser imports. The 13 timed inputs use no ZenUML. Later admission guards do not change this dataset's reduction; the summary SHA remains unchanged after guarded reanalysis.

The capsule retains complete canonical `measurement`, `coverage-final` and `qualification-client` directories. `samples.jsonl`, `context.json` and `coverage.jsonl` are convenient copies of their canonical files. Paths in receipts name the original workspace; each run's relative `png/` and `svg/` paths resolve against its owning directory. Excluded historical directories retain their original absolute-path receipts even where their directory was renamed to preserve a fresh canonical path. No historical timings are pooled.

## Read and verify existing evidence

```sh
cd seven-png-evidence-2026-10-29
sha256sum --check SHA256SUMS
```

`audit.json` records independent byte/pixel, sample/cell, stage and score checks. `audit.py` reruns that audit after restoring the capsule at `/workspace/seven-png-campaign`; it uses Pillow and does not import the benchmark reducer. The two reviewer reports retain separate statistical and visual assessments. `review.json` binds actual qualification pixels and all source-fact decisions. `campaign-plan.json` precedes the admitted measurement.

## Exact retained runtime replay

Use Node 24.19.0, Playwright 1.58.2, Chromium 154.0.8037.57, Debian 13.6/Linux 6.18.55, Fontconfig and the required Flutter Linux shared-library dependencies. The recorded cloud host is AMD EPYC 9V74. Docker must permit CPU2, a one-CPU quota, 16 GiB and the readonly host-userland mounts used by `container.py`; this is a resource-limited setup on the same machine, not a full-userland container image fingerprint.

On a fresh workspace, restore the supplied `assets-final` and `assets-coverage` beneath `/workspace/seven-png-campaign`, and the supplied public browser package distributions to the package paths recorded by context.json. They are identical published bytes or explicitly bundled published entries; npm lockfiles in the source snapshots record their acquisition. `assets-final` includes the native Dart executable and complete Flutter release bundle. Preserve the supplied build receipts: rebuilding changes their identity and requires fresh qualification. Supply the font from the capsule; its SHA256 is recorded in the report. Do not overwrite an existing campaign.

From a checkout at `/workspace/trident`:

```sh
git checkout f2045b56b662231b9432937c8ed2201f0c5efb06
bun install --frozen-lockfile
npm ci --prefix davebench-png --ignore-scripts
npm ci --prefix davebench-png/seven/packages --ignore-scripts
python3 davebench-png/seven/container.py \
  --out /workspace/NEW-SEVEN/measurement \
  --assets /workspace/seven-png-campaign/assets-final \
  --phase measure --review /workspace/seven-png-campaign/review.json \
  --blocks 20 --repetitions 3
```

The runner recomputes its render identity and rejects the review if code, selected participants, binaries, browser, package lock, font or other sealed inputs differ. An output mismatch is retained. Do not bypass admission to force a replay on a different font/runtime stack.

Run the coverage phase serially after measurement:

```sh
git checkout bd8e9b3fe933e4a9262dace5dd3d86700b12aa0f
python3 davebench-png/seven/container.py \
  --out /workspace/NEW-SEVEN/coverage-final \
  --assets /workspace/seven-png-campaign/assets-coverage --phase coverage
python3 davebench-png/seven/analyze.py /workspace/NEW-SEVEN
```

The reducer reads the review copied into measurement. It requires completed canonical runs. Fresh-process timing variation is expected; reproduction does not require matching the exact numeric point estimates. Use the recorded fixed 20-round budget, retain every run and do not retry until a preferred ordering or repeatability result appears.

## Build from source on a newly prepared machine

Use the final guarded runner's `davebench-png/seven/README.md`. Install Flutter 3.47.8 with Linux desktop support, Dart 3.13.7, Chromium and the Linux C++/GTK toolchain; optional SDK/sysroot selectors are documented by `native-flutter/env.sh`. Populate the exact 0.3.2 Dart/Flutter dependencies before the offline build:

```sh
(cd davebench-png/seven/dart && dart --suppress-analytics pub get)
(cd native-flutter/app && flutter pub get)
node davebench-png/seven/prepare.mjs /workspace/NEW-SEVEN/assets
```

Preparation compiles `dart compile exe` and a separate Flutter Linux release app with actual public APIs. It bundles Beautiful/Zombie published JavaScript and their required ELK initialization; it bundles Mermaid's published ZenUML addon with resolved dependencies. It preserves earlier benchmark bundles.

A fresh build must get a fresh qualification run and review. Inspect actual PNGs against the retained source-fact manifest; prior visual decisions may be reused only after verifying the new decoded pixels. The campaign review corrected two historical wording issues before timing: state26 requires two transitions to termination, allowing one shared final marker as in the actual Mermaid oracle; human actor icons and stick figures both express the actor role. Typography is not identical across libraries.

The protocol attempts all 548 documentation occurrences for coverage, retains the 20 source-fact candidates plus one collapsed-group control for review, and times the common 13. It uses 20 fresh launch rounds, two warmup passes and three calls/input/launch. File and SVG-witness retention are outside the binary-PNG client clock. Missing hashes or failed warmups now reject admission; these failures did not occur in the retained measurement.
