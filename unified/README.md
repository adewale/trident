# Collectors and reports

Each `commands.ts` command runs one module here:

| Command | Module |
|---|---|
| `versions` | `benchmark-versions.ts`: resolves and freezes each project's benchmark version. |
| `prepare` | `prepare-artifacts.ts`: installs the frozen versions through the shared community preparation (`community.ts`, `community-browser.ts`, `community-artifact-prepare.ts`, `community-source-prepare.ts`). |
| `upstream:prepare` | `prepare-upstream.ts`: builds the pinned Mermaid test runtime for Mermaid Fidelity. |
| `davebench`, `davebench:terminal`, `davebench:native-png` | `davebench.ts`, `davebench-terminal.ts`, `davebench-native-png.ts`, with output admission in `davebench-validity.ts`. |
| `drawing:correctness` | `drawing-correctness.ts`, using the checks in `../fidelity/drawing/`. |
| `mermaid:fidelity` | `mermaid-fidelity.ts` and `mermaid-fidelity/` (runtime, parser bridges, reviewed views). |
| `campaign:results` | `three-benchmark-report.ts`: DaveBench rankings from collected results. |
| `results:snapshot` | `results-snapshot.ts`: regenerates `RESULTS.md` and the generated numbers in the docs (`published-facts.ts`, `overall-score.ts`). |

The `community*` modules hold the public-artifact adapters shared by all three
benchmarks: declared npm exports, release CLIs, source builds, WASM, Python and
native workers. Product source controllers live in the product repositories.

## Collection contracts

New DaveBench and Drawing collections record their planned projects, formats and
case identities. A complete collection accounts for every lane or records why it
was blocked. An all-blocked collection has no measured score. Functional subsets
remain labelled as subsets. Older published files remain readable.

Drawing label policy `drawing-reviewed-labels-v2` includes reviewed group labels and the full reviewed label inventory.
Its source/expectation digest is separate from the per-format observer digests.
Changed common expectations require a new campaign; changed SVG observation does
not invalidate terminal observation. A changed observer cannot be merged into
only some projects of an existing format. Historical scores remain at their original commits. Current published results
record the policy and observer profiles used for their collection.

SVG label profile `svg-label-paint-v3` can qualify a flat opaque label against an
opaque static gradient with ordinary sRGB stops and sRGB/linearRGB interpolation
when a colour channel separates that label
from every stop's channel range. It retains canvas, clipping and occlusion checks.
Possible colour matches, wider colour spaces, transparent or animated gradients, inherited gradients,
patterns, arbitrary filters and unmapped path/image glyphs require separate
evidence; a positive text bounding box does not qualify them.
For static SVGs made only from text and primitive geometry, label assessment
retains global paint checks and skips the unrelated visible-ink inventory.
Images, references, HTML labels and animated content keep the full observer path.
When those checks are unavailable, a bounded positive raster witness can prove
plain SVG or transparent HTML text survives its actual backdrop and clipping.
It compares complete original glyph masks, positions, contours and contrast;
unsupported effects and path/image glyphs still require separate evidence.

Workers own one outstanding request, bounded JSON frames and private process
groups. API durations come from the worker/browser. A missing API duration leaves
the median time unavailable; controller elapsed time cannot break a ranking tie.
One local timing collector may run per user at a time. A lock left by SIGKILL must
be inspected before removal; its file records the owner.

Drawing checkpoints are atomically replaced at project/completion boundaries and
after 25 case checkpoint opportunities or five seconds, checked after each case.
A crash may lose progress since the preceding checkpoint. Reports load each
current numeric input once and share the pure DaveBench model without importing
collectors.

## Qualifying a cheaper Fidelity environment

Fidelity reduces each candidate before loading the next. Reference reuse requires
a matching control receipt binding source, selection, harness, installed bytes,
Node runtime and the result, callback-audit and environment evidence. Older controls without that receipt
must be recollected. Test files still use separate processes.

The harness digest includes every bridge language, build template and lockfile.
The import rewriter's TypeScript package is a runtime dependency; its installed
implementation bytes contribute to the control identity.
Candidate bindings also hash the actual bridge executables, scripts and generated
WASM/glue. Python bindings include installed package sources and extensions;
Fidelity's Python worker bypasses mutable bytecode caches. Collection checks those
bindings again after execution and refuses changed inputs or harness files.

To qualify DOM-free files, collect the same frozen selection and artifacts once
with `TRIDENT_FIDELITY_ENVIRONMENT=jsdom` and once with
`TRIDENT_FIDELITY_ENVIRONMENT=node`. These are semantic qualification runs, not
timing benchmarks. Compare them with:

```sh
bun scripts/qualify-dom-free.ts JSDOM_RUN NODE_RUN PINNED_COMMIT FRESH_OUTPUT.json
```

The comparison requires attested actual environments and identical expanded
callback identities, outcomes, normalized failures, gaps, faults and native-operation counts. It reads one candidate pair at a time. Only
files equal for the supplied cohort are listed. A reviewed receipt can replace
`mermaid-fidelity/dom-free-files.json`; automatic use additionally requires its
control identity and exact candidate binding to match. An older or mismatched
receipt keeps jsdom. Vitest projects select the environment; a startup guard checks
actual globals before imports. Original JSDOM directives retain JSDOM.
