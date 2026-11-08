# Benchmark evidence completion

PR [#88](https://github.com/adewale/trident/pull/88) merged as
`2e1bf0a76e026a54ef427127e6bc8f30e91d57bc`. Its published observations remain
available at that commit. This collection uses the same
[frozen product catalog](../benchmark-campaign-2026-11-07/catalog.json).

## Fresh measurement collection

The [published numeric files](../../../results/release/README.md) account for
153 complete DaveBench runs and 205,326 calls: 16 SVG, 17 PNG and 18 terminal
lanes, each with three full 1,342-input repeats. There are no blocked lanes or
missing durations. Native PNG, image and terminal collections ran serially,
without competing semantic jobs or fixture tests. No historical measurements were mixed in.

Termaid's public Python launchers now share Fidelity's isolated, source-only
command. The command, interpreter, worker and installed package tree are bound
before use and checked again afterward. Ready metadata reports the installed
package version. A regression poisons a valid timestamp bytecode cache and
injects a shadow module through `PYTHONPATH`: the public worker still loads the
sealed source, and rejects a later installed-source change.

After this correction, Termaid's three terminal timing runs and all 127 Drawing
cases were recollected separately. Each timing run admits 1,286 inputs; every
Drawing case outcome reproduces the preceding collection. The terminal result
records this consolidation, and Drawing retains the runtime binding when merging
the affected lane. Every other fresh observation is preserved.

The shared Chromium selector honors the configured executable, so CI fixtures
use the same pinned browser that the workflow warms. This corrects a setup-time
failure where the drawing fixture launched the unwarmed system browser instead.

## SVG label qualification

The `svg-label-paint-v3` profile can prove separation between a flat opaque
label and an enclosing static opaque sRGB gradient. At least one colour channel
must lie outside every stop's channel interval, allowing a two-unit rounding
margin. This suffices for both sRGB and linearRGB interpolation. Transparent,
inherited, animated and wider-colour-space gradients remain unavailable. A single
SVG `feDropShadow` can preserve an already opaque backdrop's source graphic;
filters that erase, clip or otherwise alter that source receive no such proof.

Independent fixtures cover a visibly separated label, a label camouflaged by
the same gradient, alpha, inheritance, animation, wide-gamut colour, filters and
opaque covers. The proof extends the existing observer; it does not infer
visibility from SVG text or a bounding box alone.

Static SVG label assessment now avoids constructing shape inventories used only
by the separate visible-ink profile. It still checks every primitive's paint and
all label, canvas, clipping and occlusion obligations. The original and optimized
paths agreed on all 1,882 captured label probes, with zero mismatches and zero
observer budget exceptions. This is finite decision-equivalence evidence, not a
performance measurement. The [review receipt](svg-label-review.json) records the
source hash and comparison digest; rendered outputs were discarded.

The profile also admits a bounded positive raster witness for plain SVG text
and transparent HTML labels. It captures the actual drawing, the unchanged
backdrop with that text hidden, an independently unclipped copy of the original
glyphs, a complete black glyph mask and the restored drawing. Font properties,
every character position and the surrounding scene must remain stable. The
actual image must preserve the complete glyph ink, canvas containment and
measured contrast, including contrast along its contour. A blank image formed
by erasing a glyph-shaped backdrop cannot pass.

The witness retains transforms and wrapping, checks off-page characters and
rejects changed typography, generated content, concealed spans and unsupported
paint effects. Work is bounded by element, text and pixel limits. Independent
fixtures cover these obligations and their counterexamples. Failure to obtain
this positive proof remains unassessed; it does not establish a renderer error.
It does not recognize letters baked into paths or images.

The remaining terminal budget case used a cubic search through rows that could
not close a frame. Indexing actual lower corners and checking cheap exclusions
before frame contents removes that work and the temporary vertical-edge arrays.
The one-million-unit limit remains unchanged. The previously unassessed case now
passes, while dense adversarial frame searches still exhaust the limit.
Independent wide-frame controls check both a visible label and a misspelling.

The complete fresh Drawing collection contains 4,318 outputs: 3,079 correct,
374 incorrect, 86 invalid-format, 634 renderer failures and 145 unassessed SVGs.
All 2,286 terminal outputs are assessed. Relative to the preceding PR head,
exactly five outputs change from unassessed to correct. The counts and case
changes are recorded in the
[published results](../../../results/release/drawing-correctness.json) and
[review receipt](svg-label-review.json). All project/format lanes are recollected
under the current source and observer digests. The receipt identifies every
remaining SVG output and the conservative observer's unavailable obligations.
General masks, path/image glyphs, unsupported effects and other representations
outside the qualified profiles remain unassessed. Neither missing DOM text nor
an overlapping bounding box proves that a label is absent. PNG remains outside
Drawing Correctness's scope.

## Fidelity reference population

The control now executes the pinned production source without candidate import
rewriting, using the original Jison and JSON-schema build plugins and the pinned
runtime dependencies. Its working directory matches upstream's runner. All
7,346 active callbacks pass; 18 original skip/todo callbacks remain excluded.
There are no reference-unqualified callbacks. This replaces the earlier
3,661-of-6,439 population, whose proxy control did not execute the full source
suite. Earlier observations remain at their original commit.

Source identity covers the tracked and generated source, compiler plugins,
documentation fixtures, runtime dependency bytes, runner and harness. Trident's
TypeScript import rewriter is included in the sealed runtime dependencies. Reused
controls also verify their raw result, callback audit and environment receipts.
The source control needs no synthetic native-operation count. Candidate
callbacks still require a real operation and complete audit evidence.

Literal and computed dynamic production imports cannot silently execute the
reference implementation on a candidate's behalf. Unbound imports and unknown
namespace reflection produce persistent adapter gaps. Callback audits finalize
after failed setup and cleanup hooks, and preserve literal ` > ` in test names.
These changes alter the assessed candidate population; missing adapters remain
unassessed rather than receiving passes or candidate failures.

## Full DOM-free comparison

The previous Node qualification is withdrawn: Vitest 4 ignored the removed
`environmentMatchGlobs` option and actually executed those files in JSDOM.
The replacement uses supported project configuration, with a startup check of
`typeof window` and `typeof document` before production imports. Successful
per-file receipts attest the actual environment, independently of the plan.

Both profiles cover all 352 selected files and all 26 frozen candidates against
one shared JSDOM source control. One original file explicitly requests JSDOM:
`packages/mermaid/src/docs/.vitepress/theme/colorScheme.spec.ts`. Vitest gives
that directive precedence over the project setting. Its attempted Node run is
rejected before imports and recorded as a source-bound JSDOM requirement;
it is never counted as successful Node execution.

The complete comparison qualifies 349 files for automatic Node execution and
retains three in JSDOM. Every file has a complete paired observation or the
explicit source-bound environment requirement; no callback or audit evidence is
missing. The retained files are the ER parser suite (different outcomes), the
event-modeling suite (DOM-dependent setup), and the explicit JSDOM directive.

The [collection receipt](fidelity-collection.json) and
[qualification](../../../unified/mermaid-fidelity/dom-free-files.json) record the
complete comparison. Fingerprints compare each callback's identity, outcome,
normalized failures and semantic audit dispositions, including caught faults.
Equal completed collection failures qualify only cheaper scheduling of the same
failure and grant no semantic credit. Two empty observations cannot qualify.

The full automatic-selection check reran Merslim's 352 files with 349 actual
Node environments and three actual JSDOM environments. Every callback, file
collection disposition and semantic audit fingerprint matches the JSDOM
baseline, with zero mismatches.

Automatic selection requires the recorded source/control, qualifier and actual
executable/artifact bindings, including paths. Other installations retain JSDOM
until qualified. Files with observed differences retain JSDOM. The control
always uses JSDOM. Qualification runs are concurrent semantic work; they support
no numeric memory or speed claim. Browser/application suites outside the selected
core-package runner remain outside this assessment.

## Pinned native Flutter bundle

The successful [native verification run](https://github.com/adewale/trident/actions/runs/42393795835)
built Flutter 3.47.8 / Dart 3.13.7 with the committed `mermaid_flutter` 0.3.2
lockfile. Its artifact archive SHA-256 is
`296208a79ab08f0e602dc16e3e74138464cd8fcdfcdf2dafc8506697b01458fc`;
the verified bundle file-map digest is
`a25b5d496209135c633ee1d0c0d58ef49b7cec11c54c34266acf2c6ac166cff4`.

The complete relocated bundle was verified against current source, SDK, lockfile
and every bundle file before use. On this host, the native Linux release worker
passed all nine independent PNG admission controls and the fixed `renderToPng`
smoke request under Xvfb. A separate production JSON-line worker call completed
and exited normally after EOF. This supersedes the earlier compatibility-SDK
probe; no dependency substitutions were needed. CI supplies build and smoke
evidence. Corpus timings are collected separately outside CI.

All three native PNG corpus runs admitted 1,114 of 1,342 outputs, with 228 API
errors per run, no timeouts and no invalid returned PNGs. Every call supplied an
API duration. The total API times were 24.806, 23.902 and 25.093 seconds; the
median is 24.806 seconds. The
[raw native collection](../../../results/release/native-png.json) retains the
complete build and smoke receipts, resolved host libraries, worker identities,
rendering request and numeric runs. These are mechanical admission and timing
results; PNG drawing meaning is not assessed.

The complete native bundle, source, SDK and smoke receipts were verified again
after collection and matched the recorded identity. The collector also performs
this end check before marking future collections complete. The final production
worker integration smoke completed and exited normally with the current transport.

The process memory guard counts the owned worker tree, including renderer and
Xvfb children behind shell wrappers. Docker collection also sets a container
memory limit. RSS polling is a best-effort resource guard, with its scope, limit
and availability recorded in the collection environment; it is not an exact
peak-memory measurement.
