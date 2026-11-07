# Trident's three benchmarks

Agreed direction, 2 November 2026. All three collectors are implemented. The
[methods and coverage details](benchmark-results-details.md#why-coverage-is-incomplete)
report the remaining assessment and adapter gaps explicitly.

| Benchmark | Question | Workload | Better result |
|---|---|---|---|
| **DaveBench** | How many documentation examples complete, and how long does rendering take? | Every Mermaid block occurrence in the same pinned generated `docs/` tree. Separate SVG, PNG and terminal-text runs. | More completed examples first; for equal completion counts, lower median total time over three runs. |
| **Drawing Correctness** | Does the output show the specified diagram's labels, without errors or raw syntax? | One shared, versioned corpus of real examples and bug reproducers from renderer tests, issues and PRs, starting with the existing 116 drawing cases and expanding beyond terminal projects. Assess SVG and terminal text separately. | More whole examples with every expected label shown and no raw syntax. |
| **Mermaid Fidelity** | How many tests from the pinned Mermaid test suite does the implementation pass? | Inventory the full pinned suite, execute original tests through candidate adapters, and account for every test and omission. | More fully passed upstream test cases on the same fixed test population. |

Equal correctness/fidelity counts share a rank. DaveBench retains its
completion/time tie rule. Each benchmark has its own league tables, one per output
format, and those tables never combine benchmarks or formats. Each result names its
workload and renderer version.

Separately, an optional [equal-weight overall synthesis](overall-scoring.md)
combines the three benchmarks in one extra table. It shows score ranges and the
range of ranks each project can still reach; while measurements are missing it
withholds an exact overall score and never treats missing work as zero.

## DaveBench: SVG, PNG and terminal text

Use the [existing DaveBench method](davebench-definition.md) for all three output
formats: identical documentation occurrences, 30 warm-ups, three complete runs,
one timeout policy, completion counts and summed elapsed render/export time.
Keep duplicate documentation occurrences. The current workload contains 1,342
occurrences across 49 files at Mermaid commit `370c4af57f43cb0bda05f4a9fe2d99c912ba16dd`.

Terminal participants return their native terminal text, including Unicode or
ANSI where appropriate. Do not turn it into PNG. Time the actual text-rendering
operation and discard its output. Declare persistent API/worker versus fresh
CLI process boundaries; include process startup when that is the chosen path.
SVG-to-PNG conversion and encoding remain inside PNG timing.

Publish three tables: SVG, PNG and terminal text. Report completed, failed,
timed-out and attempted counts alongside all three run times. A completion needs a
returned output that passes [mechanical admission](davebench-definition.md#output-admission):
a sized SVG, a valid PNG, or terminal text that is neither empty, an error message
nor the source printed back, and that is not a fallback render drawn from the source
text (the header line, or most of its raw statements, shown verbatim). Time breaks equal completion counts only between rows
with the same boundary kind (fresh process or persistent API). DaveBench retains
numeric results and provenance only; it saves no rendered outputs and judges
drawing meaning only as far as the fallback check does.

**Collectors:** `davebench` measures SVG/PNG; `davebench:terminal` measures native
terminal text through persistent APIs or declared CLI boundaries. Both admit each
output mechanically after the clock stops, then discard it, and use the same pinned
documentation occurrences.

## Drawing Correctness: real rendering failures across formats

Carry forward the reviewed source facts and useful observers from Terminal
Drawing Facts. Its 116 drawings are the seed corpus, not a permanent size limit
or a claim of representative production usage. The four invalid-input controls
are not drawings and do not enter this score.

Expand discovery to all applicable renderer projects, including SVG/PNG projects
and Mermaid itself. Gather literal inputs from tests, issue reproducers and PR
regressions. Preserve original sources, links, revisions and intended behavior.
Expected drawing facts must come from the source and reviewed regression intent,
never from whatever a candidate currently produces.

Deliberately emphasize common, consequential rendering failures. Prioritize
issues with strong user interest (reactions and substantive reports), repeated
independent reproductions, and failures recurring across projects. Record those
signals at a dated snapshot. Comments alone are a noisy popularity signal.
Deduplicate repeated reproducers and retain their multiple origins. Freeze the
selection before scoring candidates; popularity guides selection, not extra
score weight. Retain family and feature coverage alongside the bug-focused cases.
The expanded corpus size follows discovery and review; do not invent a new
arbitrary replacement for 116.

Each case declares concrete facts from its source: objects, labels, connections,
direction, group membership and quantities. Drawing Correctness checks the cheap,
deterministic part of those facts: **labels**. A case passes when every label the
facts name appears in the output and no raw Mermaid syntax is shown (the diagram
header, a node definition such as `A[Label]`, or outside terminal art a piped edge
label `|label|`). An empty return, an error message, the source printed back or a
zero-size SVG is a nonpass. Each whole case earns one pass. This measures whether
the specified content is shown, not edges, arrow direction, layout, styling or
pixel identity with Mermaid.

The collection leaves <!-- fact:drawing-unassessed -->150<!-- /fact --> of
<!-- fact:drawing-rows -->4,318<!-- /fact --> results unassessed. Unsupported
observations receive no correctness credit.

**Formats:** SVG labels must pass the existing browser observer's visibility,
canvas, clipping and resolved-paint checks. Hidden DOM text earns no credit;
unsupported filters, masks and glyph representations stay unassessed. Terminal
matching preserves reading order and joins wrapping inside observed boxes.
**PNG is not part of Drawing Correctness.** OCR cannot read diagram labels
reliably enough: on Mermaid PNGs rasterized from SVGs that pass 124 of 127 cases,
Tesseract found every label in only 43. PNG production and speed remain in
DaveBench. Mermaid Flutter has no SVG or terminal output, so Drawing is not
applicable to it in the synthesis.

**Current implementation:** `drawing:correctness` uses 127 unique inputs across
20 families and 19 source projects. The 116 valid seed entries contain 115 unique
inputs; pinned project regressions add 12 more after deduplication. Expected labels
come from the reviewed source facts (`fidelity/drawing/labels.ts`); a chart naming
no labels is checked for raw-syntax leakage. Reaction counts were unavailable;
repeated independent regressions guide this initial expansion. The corpus does not claim a popularity
ranking.

## Mermaid Fidelity: execute pinned upstream tests

Use one common Mermaid pin for every participant. Start from the full upstream
test inventory, including family parser/database suites and parser-package tests,
and account for other render, browser and API suites explicitly. Let the original
runner expand parameter tables, loops and dynamically constructed inputs. A
statically extracted input or a successful render is not a passed upstream test.

Execute original test bodies, inputs and assertions through adapters that expose
the candidate's real behavior. Import substitution and schema views may map native
parser/model values into the interface expected by an upstream test. Adapters
must not fill in expected answers, implement missing candidate semantics, or let
Mermaid perform the work being credited to the candidate. An internal import is
not, by itself, a reason to discard a useful semantic test.

Run pinned Mermaid as the control. A pass requires all original assertions to
pass against the candidate and the corresponding control to pass. Count expanded
test cases, not individual matchers. Intentional behavior differences are still
nonpasses for fidelity. Distinguish assertion failures and unsupported candidate
operations from Trident adapter/runtime failures. A missing adapter must not pass
because a negative assertion happened to catch its exception.

Keep a complete inventory with pass, fail, unsupported, upstream-skipped and
Trident-blocked outcomes. Any benchmark-wide exclusion needs a stated reason
and applies equally to all candidates; do not silently remove hard tests or
change the denominator for each project's supported families. Tests of Mermaid's
build tooling or other non-renderer concerns can remain accounted for outside
the scored population. Show total inventory and scored population together.
Results must disclose incomplete Trident coverage rather than present it as
complete suite execution.

### Approaches inspected

- **Pele**, inspected at [`3a2f075`](https://github.com/obsidianmd/pele/tree/3a2f075ee0c3d914f0fad3545fc0f193693975ac):
  [`sync-specs.mjs`](https://github.com/obsidianmd/pele/blob/3a2f075ee0c3d914f0fad3545fc0f193693975ac/scripts/sync-specs.mjs)
  copies pinned parser/database specs and redirects imports to its adapters.
  Per-family manifests and generated `SKIPPED.md` files explain unported tests.
  The inspected compatibility headers name Mermaid 12.1.0. It is not a claim
  that every test in the Mermaid repository runs unchanged.
- **Agentic Mermaid**, inspected at [`6cb261f`](https://github.com/adewale/agentic-mermaid/tree/6cb261fed3d1dbe44abb27f0de24f83a2edd4a7e):
  its [original assertion runner](https://github.com/adewale/agentic-mermaid/blob/6cb261fed3d1dbe44abb27f0de24f83a2edd4a7e/eval/mermaid-upstream-assertions/README.md)
  executes original Mermaid 12.2.0 family files and parser-package tests in
  Vitest, changes import declarations, and uses real native model views.
  It reports reference failures, adapter gaps and skipped cases. Its documented
  scope is family suites, not the whole repository's application/browser suites.

Adopt their pinned-test execution and explicit accounting, and extend the
inventory systematically. Do not preserve the 49-case selection as the target.

**Current implementation:** `mermaid:fidelity` inventories the test files at the
pinned Mermaid reference (Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact -->; the version and commit are in
`data/upstream-mermaid-policy.json`), attempts the <!-- fact:fidelity-files -->352<!-- /fact --> core-package files in original
Vitest, and lists the rest outside that runner. The current collection (<!-- fact:fidelity-collected -->7 November 2026<!-- /fact -->) expanded <!-- fact:fidelity-expanded -->6,439<!-- /fact --> callbacks; Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact -->
passes <!-- fact:fidelity-population -->3,661<!-- /fact --> of them through the reference adapter, and those are the scored
population. Every candidate attempted all <!-- fact:fidelity-files -->352<!-- /fact --> files against one shared control run
(`--reuse-reference`): 13 through their JavaScript parsers and 13 through parser
bridges, small programs in each project's own language that call its own parser
(`unified/mermaid-fidelity/bridges/`), read through reviewed per-project schema views.
Fifteen selected files do not load; each needs a Mermaid internal at import. The
historical 49/154-case selections are not substituted for the original tests.

## How the portfolio drifted

The history shows implementation coverage gradually replacing benchmark purpose:

1. [`8301784`](https://github.com/adewale/trident/commit/8301784) described broad
   Diagram Meaning, model/edit contracts and upstream assertion replay alongside
   documentation rendering. These mixed benchmark questions and harness concerns.
2. [`76ddd6d`](https://github.com/adewale/trident/commit/76ddd6d) froze a useful
   real-project corpus, but discovery was limited to terminal-advertising projects
   and selection capped at 120 inputs. [`5742542`](https://github.com/adewale/trident/commit/5742542)
   added explicit source obligations; those obligations are worth preserving.
3. [`2217ba9`](https://github.com/adewale/trident/commit/2217ba9) correctly moved
   authored harness workflows out of comparative scoring. The broader drawing
   benchmark was left without a replacement external corpus across formats.
4. The selected public-test work became the 49-case adapted behavior benchmark
   ([`7c0a2a5`](https://github.com/adewale/trident/commit/7c0a2a5),
   [`b95ff5b`](https://github.com/adewale/trident/commit/b95ff5b)).
   [`f454927`](https://github.com/adewale/trident/commit/f454927) then gave narrow
   collected subsets separate scoreboards instead of restoring the broad questions.

Repairing unreliable assessments was necessary. Turning each currently supported
slice into a separate headline benchmark was the mistake. Trident's coverage
gaps belong in implementation status, not in definitions that permanently narrow
the questions users want answered.

## Consolidation and implementation status

- **Terminal Drawing Facts** becomes the seed of **Drawing Correctness**.
- **Mermaid Behaviour Tests** and **Mermaid API Compatibility** feed the single
  **Mermaid Fidelity** benchmark. Their old counts retain their original scope.
- **Invalid-input rejection** belongs with relevant upstream Fidelity cases;
  remaining authored controls are harness regressions, not a separate league table.
- **Matched-workload timing** remains historical analysis. DaveBench is the
  portfolio's completion/performance benchmark.
- Harness/observer regressions, model/editing diagnostics and reference setup
  checks remain maintenance tools, not additional renderer benchmarks.

This definition changes the portfolio, not historical results. Terminal DaveBench
collection is implemented. Remaining implementation is broader bug-corpus
discovery and cross-format drawing assessment, and a shared original-upstream-test
runner.
