# Ecosystem campaign — 31 October 2026

[Ranked results](../RESULTS.md) compare every eligible brand on its applicable
rendering workloads. The previous overview and dated diagnostic studies remain
linked there. This campaign replaces the current landing tables; it does not
relabel earlier measurements as a release baseline.

## Inputs and coverage

| Workload | Applicable projects | Corpus and expectations |
|---|---:|---|
| DaveBench SVG | 16 | Mermaid syntax documentation at `1fb7869866dd619168d840291c9c54b4f129758b`: all 548 fenced occurrences, 546 distinct sources, 34 pages. Literal source retained. Trident's independently transcribed source facts cover 16 drawings across flowchart, state, block and pie, plus one settings-only occurrence. The other 531 occurrences lack reviewed drawing expectations. |
| DaveBench PNG | 17 | Identical 548 sources. Native PNG or a declared public SVG call followed by shared conversion. Codex inspected actual retained PNGs against the source contracts; 221 distinct case/image reviews bind source, expectations and PNG hashes. No SVG-derived raster credit. |
| Mermaid Feature Cases | 16 | All 100 AM/Trident-authored development cases in `fidelity/cases.ts`, with explicit labels, relationships, values, groups and visibility facts. The same planned SVG checks apply to every participant; unavailable projections remain unknown. |
| Terminal Rendering | 18 | All 120 sources selected from capped research across 18 pinned project repositories, 17 contributing inputs. Origins retain commits, files, issue/PR snapshots, hashes, licenses and extraction changes. There are 67 terminal-specific and 53 shared-renderer robustness cases. Independent contracts support the 16-drawing observable profile. |
| Public Model Contracts, optional | 3 bound; 24 binding gaps | The same 100 authored sources through reviewed public Node model APIs. Every planned native criterion must pass for a case to count. No duplicate SVG collection or private serializer workflows. |

The 27-project selection includes distinctly branded renderers, including Dart
and Flutter separately. It excludes validator-only tools, unbranded descendants,
shared-engine application wrappers and explicitly omitted projects. Mermaid is
the rendering/model baseline. It has no terminal renderer; Mermaid ASCII is the
terminal baseline, and Mermaid supplies an unscored source check.

Corpus origins and exact inputs: [documentation expectations](../corpus/docs-reviewed.json),
[authored cases](../fidelity/cases.ts), [terminal corpus and provenance](terminal-corpus.md).
The source facts were reviewed independently of renderer outputs. These public,
development-exposed inputs are not a validated holdout or usage-frequency sample.

## Collection and repairs

Collection used frozen public releases or pinned source artifacts on Linux,
Node 24.19, Bun 1.4.2 and Chromium 154. All inventories were attempted once:
no performance warmups or adaptive repetitions. Preparation, executable hashes,
versions, source revisions and transport boundaries remain in the raw archive.

The initial rendering collector ran at `934fb3d`. Model collection initially
failed before making public calls because of a Trident identity serialization
bug; its three bound targets ran after that repair at `bc95ac7`.

Only missing work was repaired:

- Merslim stalled after 215 SVG outcomes. A bounded cleanup/recovery fix collected
  its remaining 333 literal input coordinates; the original outcomes remain.
- Latias Merman's Node package had been admitted as PNG-capable without a public
  PNG binding. Its first actual 548 PNG exports used its published browser SVG
  API plus declared shared conversion.
- The terminal collector first covered all 18 targets. Three transport gaps then
  used existing or authenticated public CLIs: Crafter, Ondine and Latias Merman.
  That targeted collection failed during final assessment. Recovery graded saved
  text without repeating calls. It retains 299 text witnesses and direct
  invocation evidence for 328 of 360 coordinates; 32 invocation states and lost
  CLI clocks remain unknown. The original launch failure and recovery limits are
  preserved. The collector now checkpoints raw evidence before assessment.

SVG grading was corrected for inline arrow geometry, extraneous visible nodes
and unbound endpoint projections. All retained documentation and feature SVGs
were then rechecked with the same observer, without calling a renderer. The
recheck records its own source, browser, environment and font-readiness policy;
original outputs, verdicts and collection dates remain alongside it.

## How to read the comparisons

Every table ranks its named metric best first, with shared ranks for ties, and
shows its difference from Mermaid. For Terminal Rendering it shows the difference
from Mermaid ASCII. Return counts and verified-content counts stay separate.
A lower verified count with unknown work is not a count of incorrect drawings.
A project with wholly unresolved content remains unranked.

The SVG observer and human PNG review have different verification limits. For
example, an unprojected SVG endpoint can stay unknown while a separate actual
PNG review establishes that image's content. Raster review does not retroactively
pass an SVG criterion.

There is **no qualified comparative speed result** from this single-pass campaign.
Retained descriptive clocks differ across warm APIs, process-starting CLIs,
native exporters and SVG conversion. Unknown correctness and missing A/A controls
prevent a fair faster/slower league table. Expensive scaling, cache and memory
profiles remain optional investigations; they were not repeated as a release ritual.

Upstream test conformance still has no qualified peer benchmark. Retired Assertion
Replay is not a substitute, and the original Mermaid runner is a reference check.
The campaign improves and exercises the current benchmarks; it does not establish
full DaveBench accuracy, complete terminal correctness, or release qualification.
