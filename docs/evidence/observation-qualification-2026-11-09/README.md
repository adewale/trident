# Import collection and retained SVG reassessment

This follow-up keeps the 7 November product freeze, Mermaid 12.3.0 source pin and
benchmark populations. It fixes Fidelity imports that prevented unrelated original
tests from collecting and improves SVG label evidence. DaveBench timing files and
all retained producer output bytes are unchanged. The original measurements and
archive remain at [v0.3.0](https://github.com/adewale/trident/tree/v0.3.0/results/release).
The [collection receipt](collection.json) binds the executing code, frozen inputs,
unchanged timing files, current archive and refreshed qualification.

The current boundary worker is `4baa684`. Its source control passes all 7,346
active callbacks, and Linux and macOS CI pass. The [refresh receipt](boundary-review-pending.json)
records nine complete candidate JSDOM collections, preserving every previous pass
and assertion/fault nonpass. The host then exhausted its process budget: esbuild
and Vitest failed during startup. Seventeen candidate collections need repeating;
paired Node qualification and automatic selection are still pending. Incomplete
startup failures are excluded from the follow-up evidence.

The tables and complete qualification below describe the preceding collection at
`e88030a`, before the final boundary guards. Published numeric files retain that
complete collection and its recorded execution identity. The current worker
invalidates its automatic Node reuse and falls back to JSDOM until new paired
qualification is complete.

## SVG results

The observer now measures the actual ink of a plain, unwrapped HTML text run when
its font metrics match browser range geometry. It distinguishes unused font-box
overflow from cropped glyphs. The raster witness also preserves opaque HTML
backgrounds when isolating text, and can prove an entire original run containing
an expected literal label. It supplies no replacement glyphs or renderer geometry.

Independent controls cover uppercase letters, descenders, horizontal and vertical
cropping, SVG scaling, pseudo-text concealment, opaque backgrounds, low contrast
and additional notation. Unsupported typography and effects still withhold proof.
Collection admission includes both a positive HTML font-box-overflow control and
a negative clipped-glyph control.

The [complete replay comparison](drawing-reassessment.json) verifies the same
4,318 observations and 3,684 returned outputs as the released capture. No producer
ran. All 2,286 terminal rows, collection timestamps and output ownership records
are preserved. Only 25 verdicts change, all Latias Merman SVGs: 24 unknowns become
incorrect because label ink is clipped; one becomes correct. No prior pass changes.
The targeted clipping-only pilot accounts for 24 of these changes (23 failures,
one pass); replaying every renderer finds one further clipped Latias case.

| Disposition | Released | Reassessed |
|---|---:|---:|
| Correct | 3,079 | 3,080 |
| Incorrect | 374 | 398 |
| Invalid format | 86 | 86 |
| Renderer failure | 634 | 634 |
| Unassessed | 145 | 120 |

Every remaining unknown records unavailable criteria plus a glyph-proof stage,
kind and reason. None is an observer error. The bounded witness rejects these
profiles or observations:

| Proof rejection | Observations |
|---|---:|
| No original SVG/HTML text match for a required label | 63 |
| Overlapping label text boxes | 33 |
| Actual pixels differ from complete counterfactual glyphs | 13 |
| No independently contrasting exterior contour | 3 |
| Unsupported text paint, visibility or typography | 2 |
| Isolated text changes pixels outside its mask | 2 |
| A character has no independently observed glyph ink | 2 |
| Animated or image content | 1 |
| Unsupported HTML decoration, background, transform or generated content | 1 |

A failed counterfactual comparison alone is insufficient to classify a drawing
as incorrect: the witness may lack a sound comparison for that representation.
These 120 cases remain unknown and receive no verified pass credit. Their complete
per-case evidence is in `drawing-retained/results.json` inside the
[current capture](../../../results/release/captures/drawing-capture-2026-11-09.tar.gz?raw=true).
Archive integrity checks bind every returned output to its source, owner and
published verdict; terminal replay reproduces all terminal dispositions.

A [follow-up probe](glyph-boundary-probes.json) independently isolates each label
in all 33 overlap cases using the unchanged witness. No case proves every required
label: 23 first fail the pixel comparison, five restoration, four mask isolation
and one duplicate-match overlap. Removing the aggregate overlap guard would not
qualify these drawings. These diagnostic attempts change no published verdict.

## Fidelity import boundary

An outer proxy around an unbound namespace consulted the inner proxy's throwing
property descriptor trap, so even reading an unused import could abort file
collection. The replacement uses one proxy and defers unsupported exports until
actual use. Every partial module namespace rejects reflection and mutation.
Absent exports have an explicit unavailable state, including exports missing from
an otherwise recognized module. Namespace objects cannot inherit adapter-side
Object members or present an incomplete export list as candidate behaviour.
Unknown database reads reject immediately: a callable placeholder cannot prove
its own type, silently accept a call or supply an assertion result. This also
prevents caught adapter TypeErrors from earning native credit. Named database
getters bind only after an actual getter is observed; unused unavailable named
imports remain deferred. An unavailable namespace member read during setup fails
collection, since its later type or truthiness cannot be traced soundly. Merely
importing an unused module does not exercise its unavailable exports. Jison logger
installation remains unscored setup; reading that logger remains unassessed.
Filtered Venn and block pilots preserve every previously measured pass and
assertion/fault nonpass for Frankenmermaid and Ondine.
There is no Mermaid fallback, substitute parser or emulated layout implementation.

The bounded pilot runs the unchanged 86 expanded callbacks in
`packages/parser/tests/radar.test.ts` against Pele's own parser. Before the fix,
the file fails collection and all 86 callbacks are gaps. Afterwards, 67 pass,
13 are unsupported and six remain gaps; the source control still passes all 86.
The complete `e88030a` cohort uses the strengthened guards from that initial
fix. The later partial-namespace and database guards need their own complete
qualification; the filtered pilots do not supply it.

Across all 26 candidates, the preceding complete JSDOM recollection changed the totals:

| Candidate outcomes | Released | Recollected |
|---|---:|---:|
| Passed | 25,479 | 26,530 |
| Assertion/fault nonpasses | 22,559 | 23,073 |
| Unsupported | 43,159 | 49,890 |
| Adapter gaps | 99,799 | 91,503 |

The same 7,346 source-qualified callbacks define each candidate's denominator.
Every candidate pass has a recorded native operation. Of the remaining gaps,
3,497 callback identities are unassessed for every candidate, accounting for
90,922 gap observations; another 581 vary by candidate. Of those shared
identities, 933 have no matching collected callback. Shared gaps do not establish
that all candidates have the same underlying limitation.
Callbacks reported skipped or otherwise lacking an audit now retain that explicit
reason. Publication rejects an unassessed callback without a diagnostic. These
reasons were regenerated from retained Vitest reports and audits, preserving all
verdicts, operation counts, rejections and collection times. The receipt records
the diagnostic reduction separately from worker execution.

The largest shared groups include swimlane anchored-node layout (266 callbacks),
the color-theme gate (210), styles (199) and ELK rendering (103). These need
bindings for layout, theming or rendering operations, beyond parser model fields.
Any extension must invoke the candidate's corresponding operation and retain the
native-operation guard.

Adversarial boundary tests exercise the actual runtime with a controlled native
parser. Wrong native results fail; no native operation, a caught unavailable
import, namespace inspection or constructor use remains a gap; a native TypeError
remains a fault. Further counterexamples cover missing partial exports, unknown
database calls, `typeof`, inherited members and incomplete namespace reflection.
They stay unassessed even when another native parse occurs in the same callback.
Unused static and dynamic imports allow original assertions to
observe a native result. Initial schema probing outside callbacks earns no credit.

The [full recollection and qualification](fidelity-recollection.json) records both
actual environment profiles, per-candidate deltas, shared callback gaps and the
automatic Node-selection check. Node reuse requires matching callback identities,
outcomes, normalized failures and semantic audits, plus the executing source,
installed bytes and candidate runtime identity. Release-label edits remain outside
that execution identity.

That complete comparison qualified 321 files for Node in common across all 26
candidates. The 28 files newly excluded from the previous common set now reach
code that had stopped at imports; several use browser globals in callbacks.
Its automatic Merslim run attested 321 actual Node environments and 31 JSDOM
environments. All 7,364 callback dispositions match its JSDOM baseline, and the
selected Node files also match callback and semantic-audit observations. A
version-only change from Trident 0.2.1 to 0.3.0 preserves the new execution
identity and all 321 eligible files.

## Reading the reports

SVG tables show pass bounds. Fidelity separates assertion/fault nonpasses from
native unsupported operations and shows shared plus additional gaps; file-local
callback ordinals preserve repeated titles and independently completed file order.
Uncollected means no callback matching the reference identity was observed; this
can include failed file collection or different parameterized callback titles.
A partial replacement drops stale shared-gap metadata unless the full callback
intersection can be recomputed. Scores retain their original denominators.

DaveBench tables name each timing boundary. Drawing checks required labels and
source-syntax leakage; edges, arrow direction, layout, styling and PNG correctness
remain outside its scope. Additional SVG profiles and native operations need
independent controls and bindings before they can earn credit.
