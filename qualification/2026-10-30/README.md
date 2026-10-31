# Benchmark repair evidence — 30 October 2026

Five frozen SVG renderers, one documentation pass, 30 authored cases and a two-size configuration follow-up. Terminal pilot: Mermaid ASCII and Termaid, with Mermaid as source reference. No artifact acquisition or new comparative timing/scaling campaign.

`summary.json` contains the bounded outcomes. Original collections are under `features/`, `docs/`, `configuration/` and `terminal/report.json`. The separate `rechecked/` and `terminal/rechecked.json` views inspect saved output after checker fixes. Original artifact seals, runtime facts, timestamps, producer identities and source inventories remain in the owning reports. Absolute paths in original records describe the original workspace.

Collection commits: 1fd3d15c09ae2fcfcf0c13e723bcf26ffbf21b36 (SVG), f06ce2cd6b81356b393f872bc3cb08afc7c66b3e (terminal), 8b879bb (configuration). The final observer source is recorded in each derived receipt. Source expectations are development-exposed; two group/collapse contracts were added for the saved-output recheck after collection, using existing controlled-PNG source facts. They are not a holdout.

## Verify and recheck without invoking renderers

```sh
sha256sum --check SHA256SUMS
# In a Trident checkout at 348deb1 or a descendant, with its frozen Bun dependencies:
bun /absolute/path/to/EXTRACTED/recheck.ts /absolute/path/to/EXTRACTED /absolute/path/to/trident
```

This starts Chromium (`/usr/bin/chromium`) only to inspect retained SVGs. It does not acquire artifacts, call any renderer or collect timing. The script relocates historical witness paths to the extracted directory. It rewrites only derived receipts and keeps original records unchanged. Renderer collection scripts are retained as historical invocation records; they depend on the original frozen artifact workspace and are not the recheck command.

Full local tests: 537 passed, zero failed, including opt-in Chromium tests. Typecheck, lint and 26 focused reporting/workflow tests passed. The initial full-test log includes two policy/default expectations subsequently corrected; `full-tests.log` is the completed passing run. The three `*-red.log` controls show regressions failing against the old observer/option mapping. Terminal tests retain genuine renderer output and reject reversed arrows, disconnected stems and changed topology; unsupported cell/layout handling stays unknown.

Limits: 16 reviewed documentation drawings across four families, one configuration-only occurrence, 531 unreviewed occurrences. No overall correctness winner or speed claim. Terminal: four inputs; rounded/shared-stem output can remain unknown. A changed observer does not become a new renderer measurement.
