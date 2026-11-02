# Campaign evidence — 2 November 2026

Numeric DaveBench measurements only. No rendered SVG, PNG, terminal output,
output hash, image size or drawing judgment is retained here. Hashes in the
manifest and artifact ledger identify JSON records or program artifacts.

- `report.json`: consolidated rankings, all valid run rows and equal-weight score readiness.
- `runs.csv`: one numeric row per project, output format and repeat.
- `images.json`, `terminal.json`: complete valid campaigns with method, environment and consolidation receipts.
- `versions.json`: 37 frozen component selections for all 27 comparison projects, checked at 2026-11-02T15:09:38.022Z.
- `catalog.json`: campaign catalog with the same versions and the corrected documented Merman stdout binding.
- `artifact-identities.json`: prepared program artifacts, revisions, integrity fields and public bindings.
- `attempts/`: original counter reports, including superseded attempts, retained for audit. These are numeric records, not renderer outputs.
- `setup-status.json`: SDK image identities and the remaining Flutter setup block.
- `manifest.json`: checksums of these evidence files.

## Workload and score

The fixed Mermaid documentation commit is
`370c4af57f43cb0bda05f4a9fe2d99c912ba16dd`. The extractor in
`unified/davebench.ts` enumerates every standalone `mermaid` or
`mermaid-example` fence under `docs/`, preserving duplicates and order:
1,342 occurrences from 49 files. Each renderer/format gets the same 30 warm-ups
before each of three full runs. Calls time out after 15 seconds.

Completion is public-operation success, not a drawing-correctness judgment.
Time includes failures. Rankings use the minimum completed count, followed by
median total elapsed call time. Exact ties share a rank. Every valid group
retains all three repeats. Persistent API initialization, warm-ups, IPC,
reporting and cleanup are outside the clock; fresh CLI process startup is
inside it. PNG includes encoding through the stated native or shared browser
conversion path. Outputs are discarded.

The equal-weight formula is `(DaveBench + Drawing Correctness + Mermaid Fidelity) / 3`.
DaveBench uses the mean of applicable format rank percentiles. The other two
new benchmark campaigns remain unimplemented, so their scores and all overall
scores/ranks are unknown. The old 116 terminal drawings and 49/154 selected
compatibility cases are not substituted. Flutter's setup block is also unknown,
not zero. See `docs/overall-scoring.md`.

## Collection and corrections

The final core image campaign ran before the final terminal campaign. Neither
ran alongside dependency preparation. Dart/Flutter SDK preparation happened
after both core campaigns. Supplemental counters then ran sequentially.

The core counter implementation was committed at
`0e673bda90cd087a98c369c67566f200ec773410`; MermaidTUI/Dart corrections were
committed at `78a36e26dd6bf5226ead6796db6e6863299d4885`. The final Merman run
uses the stdout-discard correction in the current `unified/davebench.ts`.

Two original groups were superseded in full:

1. MermaidTUI's convenience API catches exceptions and returns `Error: …`
   strings. Its three original apparent full-completion rows are invalid as
   completion measurements. The replacement invokes its same exported
   `parseMermaid → computeLayout → renderGraph` pipeline, allowing errors to
   propagate without inspecting drawings. All three replacement repeats count.
2. Merman's PNG CLI rejects `/dev/null` as a nonregular output file. Its
   documented `--output -` export succeeds when stdout goes directly to a
   discard device. The original zero-PNG group is a Trident invocation error,
   not a renderer result. All three SVG and PNG repeats were replaced after
   fixing the binding. Encoded bytes were never saved.

Dart mermaid_core 0.3.2 was compiled with Dart 3.13.7 from the pinned official
SDK image, then measured through its public SVG binding in Chromium. Both
SVG and complete PNG conversion received three repeats. The initial missing-SDK
setup block is superseded by those measurements.

Flutter mermaid_flutter 0.3.2 dependencies resolved and the counts-only Dart
worker passed static analysis. Its native release build requires a Linux
engine archive from `storage.googleapis.com`; the environment proxy denied
that download with HTTP 403. The local SDK image also lacks the web SDK.
No Flutter render calls were measured. This is an environment setup gap.

The valid consolidated population is 150 runs / 201,300 timed calls:
16 SVG projects, 16 PNG projects and 18 terminal projects, 26 distinct projects.
One additional PNG project, Flutter, is blocked before collection.

## Reproduction

Acquire the pinned Mermaid documentation Git objects and the current declared
artifacts before timing. The campaign froze releases once; do not refresh them
between formats. Runtime prerequisites include Bun 1.4.2, Node 24.19.0,
Chromium 154.0.8037.57 and the recorded Python/Go/Dart native toolchains.
Bun's `process.versions.node` value 26.3.0 is a compatibility version, not the
Node worker executable's version.

From the Trident repository, fresh collection uses:

```sh
bun commands.ts davebench --catalog docs/evidence/benchmark-campaign-2026-11-02/catalog.json --prepared CURRENT_IMAGE_ARTIFACTS --out FRESH_IMAGE_RESULTS
bun commands.ts davebench:terminal --catalog docs/evidence/benchmark-campaign-2026-11-02/catalog.json --prepared CURRENT_TERMINAL_ARTIFACTS --out FRESH_TERMINAL_RESULTS
```

The prepared JSON lists contain installed public artifact locations and must
be prepared/verified for the selected versions on the measurement machine.
The pinned native Flutter bundle is not available in this campaign; its counter
must not be treated as tested native performance.

Regenerate the measured report without executing any renderer:

```sh
bun commands.ts campaign:results --images docs/evidence/benchmark-campaign-2026-11-02/images.json --terminal docs/evidence/benchmark-campaign-2026-11-02/terminal.json --versions docs/evidence/benchmark-campaign-2026-11-02 --out FRESH_REPORT
```

Historical retained-output assessments, `results/latest.json` and the release
baseline retain their original populations, methods and measured versions.
