# Benchmark results: methods and coverage

[League tables](../RESULTS.md) contain the three current benchmarks. Every project
is displayed as one name-and-version label, such as **Pele 1.13.0**. The measurements
use the version freeze of 7 November 2026; changing presentation runs no renderers.

## Reading the tables

| Benchmark | Population | Ordering | Missing results |
|---|---|---|---|
| DaveBench | <!-- fact:davebench-inputs -->1,342<!-- /fact --> documentation occurrences, separately for SVG, PNG and terminal text (<!-- fact:davebench-collected -->7 November 2026<!-- /fact --> collection) | More admissible completions first; lower median total seconds breaks ties between rows with the same boundary kind | Blocked projects have no completion or timing score |
| Drawing Correctness | The same 127 cases, separately for SVG and terminal text | More whole cases with every expected label shown and no raw syntax; equal counts share a rank. **Possible rank** shows the positions still reachable | Unassessed: unsupported visibility evidence or unrun cases |
| Mermaid Fidelity | The expanded upstream callbacks that pinned Mermaid itself passes | More passed callbacks; equal counts share a rank. **Possible rank** shows the positions still reachable | Candidate adapter gaps remain unassessed |

For DaveBench, completions are the minimum across three runs and seconds are the
median total time. A completion needs an output that passes [mechanical
admission](davebench-definition.md#output-admission): a sized SVG, a valid PNG, or
terminal text that is not empty, an error message or the source printed back. It
measures output production and time, without judging drawing meaning. CLI rows
include process startup; persistent API rows exclude initialization, so time
orders equal completion counts only within one boundary kind.

For Drawing Correctness, Failed combines missing labels, raw syntax shown, invalid
output and render failures. For Fidelity, Failed combines assertion nonpasses and
native unsupported results; Unassessed is candidate adapter gaps. A Fidelity pass
needs the original assertions to pass for the candidate and for the pinned Mermaid
control, so callbacks the control cannot pass are unpassable for everyone. They are
reported beside the table as reference-adapter coverage work instead of being
counted as everyone's unknowns, which had capped Mermaid at 54.6% of its own tests.
Upstream skips are outside the population.

**Verified rank** orders observed passes. **Possible rank** is the best and worst
position a project can still reach when its unassessed cases resolve either way:
best = 1 + projects whose passes exceed this project's passes plus gaps; worst = 1 +
projects whose passes plus gaps exceed this project's passes. A wide range means the
order is not established yet. Detailed tables separate these categories. A wholly
unassessed project has neither a score nor a rank. An observed zero with known
failures remains a measured result. Ranks order observed passes; unresolved cases
can change that order. They do not establish an overall winner. The [equal-weight synthesis](overall-scoring.md)
combines score bounds and shows each project's possible rank; it never treats
unknown measurements as zero, for scoring or for ordering.

## Why terminal output appears in two benchmarks

The format is shared; the questions and input corpora differ:

- **DaveBench — Terminal rendering:** render all 1,342 documentation examples to
  native terminal text. Count completed operations and measure total time. No
  drawing assessment or conversion to PNG takes place.
- **Drawing Correctness — Terminal correctness:** render the 127 reviewed drawing
  cases to native terminal text and check that every expected label is shown without
  raw syntax. Timing does not contribute to this rank.

The same distinction applies to SVG. PNG appears only in DaveBench. A fast renderer may fail correctness
checks, and a correct renderer may be slow; both questions have useful answers.

Terminal label wrapping uses a bounded frame search; exceeding its work budget
leaves the case unassessed. SVG source text nominated as a possible leak also
stays unassessed when the existing visibility observer cannot resolve it.

## Why coverage is incomplete

These gaps mostly describe unfinished Trident implementation, rather than demonstrated
limitations of the projects being benchmarked.

**Fidelity runs every candidate on the whole selected suite.** All <!-- fact:fidelity-candidates -->26<!-- /fact --> candidates
plus Mermaid attempted all <!-- fact:fidelity-files -->352<!-- /fact --> selected core-package files (<!-- fact:fidelity-collected -->7 November 2026<!-- /fact -->) against one
shared Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact --> control run. During development (3–5 November), the reviewed
schema views and unsupported operations described below cut the bridged projects'
unassessed callbacks from
roughly 1,000–2,650 each to 250–1,000 (Grok renderer 2,146 → 336, Mermaid ASCII
1,490 → 296, Crafter Mermaid 828 → 250), and passes rose where native fields were
already present but unmapped (Bezel 1,804 → 2,304, Latias Merman 1,345 → 2,237,
Mermaid Dart 815 → 1,703, Mermaid RS Renderer 212 → 1,226). Where a JavaScript
candidate's module exposes no parser for a family (ER, class, C4, state or agentflow
for Zombie Mermaid, XMermaid, OpenCode Merman, VitePress Plugin Diagram, DSH Mermaid
GB SVG and MermaidTUI), those tests count as operations it does not offer, not as
Trident gaps. Across all candidates, <!-- fact:fidelity-gaps -->272<!-- /fact --> tests
remain unassessed by Trident. Thirteen are reached through their JavaScript
parsers (generic native bindings, a guarded Bun/async parser bridge, native model
schema views and the Frankenmermaid WASM binding) and thirteen through parser bridges.
Ten of the JavaScript candidates had previously been run on only 42 files, so most of
their earlier unassessed callbacks were tests Trident had not run rather than missing
bindings. Full-suite runs raised Pele from 2,157 to 2,204 passes, Agentic Mermaid from
1,186 to 1,202 and Merslim from 113 to 157; the shape-name fix below raised
Frankenmermaid from 308 to 367.

**Parser bridges reach the other 13 projects.** Their parsers are not JavaScript
modules the original tests can import, so each has a small bridge program in the
project's own language (`unified/mermaid-fidelity/bridges/`). A bridge calls the
project's own parser for the requested family and prints the model it returns, with
native field names; it parses nothing itself. Only the parser's own syntax rejection
counts as a rejection; a family or source the project does not parse is
unsupported; anything else is a Trident gap. Each bridge's build verifies the
prepared artifact (revision, crate checksum or package version) and the measured
version matches the one DaveBench and Drawing record.

| Project | Parser the bridge calls |
|---|---|
| Latias Merman 0.9.3 | the native CLI's own `parse` command |
| Crafter Mermaid 0.0.3 | the renderer's own `@crafter/mermaid-parser` dependency |
| Termaid 0.10.0 | `termaid.parser.<family>.parse_<family>()` |
| Mermaid Dart and Mermaid Flutter 0.3.2 | `mermaid_core` 0.3.2 `parseX` functions (Flutter uses core's parser unchanged) |
| Bezel 0.2.24 | `bezel-mermaid` `mermaid::parse` |
| Figurehead v0.4.3 | `figurehead::parse` and its per-family parser types |
| Mermaid RS Renderer 0.3.1 | `parse_mermaid`, the entry point its CLI uses |
| Mermaid ASCII 1.6.1 | its `pkg/graph`, `pkg/sequence` and `pkg/er` parsers |
| Grok renderer | the binary's private `mermaid.rs` parsers, compiled unchanged beside an export |
| MermaidText | its unexported Go parsers, reached by an injected export |
| Loom 0.10.0 | its module-private parsers, from an unchanged source copy with exports appended |
| Ondine 0.0.3 | no parser exists: `render()` reports acceptance or rejection only |

Three limits are the projects' own. Ondine exposes no model, so every assertion about
the parsed model is an operation it does not offer (unsupported); only acceptance and
rejection can pass. MermaidText's and Grok's parsers return nothing rather than an
error, so they cannot reject input; such sources count as unsupported. Termaid's
parsers never reject input either and return a partial model.

**Reviewed schema views map each bridged model.** A view
(`unified/mermaid-fidelity/schema-views.mjs`) reads one project's own model field by
field and answers the Mermaid database getters the tests call, for every family a
project parses: flowchart, class, ER, C4, sequence (participants and the flat message
list of messages, notes, activations and block markers in source order, rebuilt from
index-addressed models where the indexes can order every statement), state, git graph,
kanban, gantt, architecture, mindmap, requirement, pie, packet, block, journey, the
Mermaid ports' agentflow, usecase, railroad, wardley, venn, cynefin, ishikawa and
treeView records, Mermaid Dart's railroad, wardley, venn, cynefin and ishikawa models,
XMermaid's sequence, cynefin, wardley and ishikawa models, and the Langium ASTs (radar, info, git graph, architecture, treemap,
treeView, railroad) where a model can express them. Views live in
`unified/mermaid-fidelity/schema-views.mjs` and per-area modules under
`unified/mermaid-fidelity/views/`; `scripts/fidelity-probe.ts` prints the native model a
view receives. Every mapping
was checked against the project's type definitions, parser source or captured parser
output: Mermaid's own vocabularies (shape names, edge types, strokes, ER
cardinalities, class relation codes, C4 shape types, sequence line types) are matched
from each native spelling. A native value Mermaid's vocabulary has no word for (a
start-only flowchart edge) keeps the project's own spelling, so it can equal no
Mermaid value. A field Mermaid itself leaves undefined (an unlabelled relation's
title, a node without a link) reads as undefined, not as a gap. A view
never parses source text or re-splits a display string. A concept a native model does
not carry at all — Grok's class notes, Loom's node styles, MermaidText's ER
cardinalities, which it folds into a display label, Merslim's ER cardinalities, the
marker side VitePress drops from class relations, Frankenmermaid's link lengths — is
declared absent with its reason, and reading it is that project's unsupported
operation. Where two written forms collapse into one native value (zombie-mermaid's
bare node and `A[A]`, mermaid-rs-renderer's `System_Boundary` and an untyped
`Boundary`), only the ambiguous reading is unsupported. Text wrapping per element is
Mermaid's renderer configuration, which no candidate model keeps per C4 element or
per message unless it records a wrap flag itself. A field the tests read
that no view maps stays a Trident gap. Projects without a reviewed view use the
generic field-name projection.

MermaidText is a declared Go port of the Grok renderer's `mermaid.rs`. Its Go bridge
and Grok's Rust bridge were built independently and produced the same outcome for
every expanded callback; only the wording of their unsupported
messages differs. Mermaid Dart and Mermaid Flutter share one bridge because Flutter
calls `mermaid_core`'s parser unchanged, so their rows are identical by construction.

A produced drawing that could not be judged says **Not assessed**. No result is
inferred from a project's identity or relationship to another renderer.

The pinned tests frequently import Mermaid's parser and mutable diagram database,
including getters and host configuration. A candidate's interface is its parser: source
in, its own model out. Trident never runs Mermaid on a candidate's behalf or invents a
missing method, so these are **unsupported candidate operations**, a known nonpass, as
the portfolio definition requires: parsing a family the candidate does not parse;
reading, calling, spying on or inspecting Mermaid's database API (`addVertex`,
`setDateFormat`, `getConfig`, `exists`, a test's `vi.spyOn(classDb, 'setLink')`);
driving a caller-supplied database through the jison `yy` callback protocol (a test's
own `mockDB`); and reading a concept the candidate's model does not carry. One of these
in a test outranks any Trident gap in the same test, since no adapter work could make it
pass. Re-selecting FlowDB's default `gen-2` is bound as a no-op because it changes
nothing.

Three policies, decided on 4 November, settle what Trident supplies:

- **Mermaid's layout data (`getData`).** Layout data is computed from each project's own
  reviewed flowchart getters with Mermaid's FlowDB translation (shape names, arrow types,
  groups, parents, edge ids). Fields Mermaid's renderer decides itself (padding, look,
  compiled styles, colour slots, curve defaults) are not a parse result, so reading them
  is unsupported. State, kanban, agentflow and usecase layout data follow the same rule
  with Mermaid's own data fetchers; mindmap, class and architecture layout computation
  is unsupported.
- **Host configuration.** Trident records the non-default configuration a test sets and
  clears it at the start of every test, exactly as the control's Mermaid configuration
  is cleared, so a setting made outside a test never reaches a later one. When a
  candidate parses with non-default configuration in effect, the configuration is
  passed through the candidate's own configuration interface where it has one, and the
  test stays a gap where it takes source text only.
- **Mermaid's constant vocabularies.** `RiskLevel`, `Cardinality`, `LINETYPE`,
  `commitType` and the class relation codes are supplied where the candidate's values are
  already in Mermaid's vocabulary: with a reviewed view that translates them, and for the
  ports that keep Mermaid's own records (Pele, Bezel, Latias Merman). Requirement
  constants are the words a test writes into its source text (`risk: High`), so they are
  supplied to every candidate, before or after a parse; a candidate's own values are
  still compared only through a view. Elsewhere a test that uses them stays a gap rather
  than risk comparing an untranslated value.

A database the test reads before parsing (or after `clear()`) is, for a candidate with
no database class of its own, the candidate's own parse of a diagram with only its
header (`usecase-beta`); a candidate that rejects a header-only diagram has no empty
model and such reads stay gaps. A getter read whose value no assertion uses is not an
observation. A getter imported by name from a database module (`getAccDescription`
from `commonDb`) reads the parsed diagram when called, and Mermaid's public
`mermaidAPI.parse` is the candidate's own parser for the file's family. That empty
database has published no AST (`usecaseDb.getAST()` is undefined until a parse
succeeds). Mermaid's chevrotain usecase parser publishes only on success, so a read after
a rejected usecase parse sees the database as it was before the parse.

Four further rules, decided on 5 November:

- **Failure messages are not observations.** When an assertion has already failed and
  formats its message or diff, the values it prints are read again. A declared-absent
  field read then does not turn the failed test into an unsupported one. Snapshot
  matchers serialise values in order to compare them, so reads under them still count.
- **Records list the keys Mermaid always sets.** A class, ER, C4 or sequence record whose
  Mermaid counterpart always carries a key (`wrap`, `cssClasses`, `alias`) lists it even
  when the candidate's model has no value for it, so a whole-record comparison reads the
  key and records the absence, rather than failing on a key count. Keys that Mermaid
  itself can leave undefined are not listed.
- **Mermaid's own pipeline.** `Diagram.fromText` in a shared test drives Mermaid's diagram
  detection, type ids and registry, and `preserveCommentsWhenParsing` is a flag that
  Mermaid's Diagram pipeline reads. Both are unsupported for every candidate, as are the
  renderer layout getters, whether or not a diagram has been parsed.
- **Record identity.** A view builds each record once per parse, so a test comparing
  two getters' results with `toBe` sees the same object, as with Mermaid's database.

Two rules added on 7 November, after an audit of scored failures whose received value
was `undefined`:

- **Trident's own errors are not candidate failures.** A `TypeError`, `ReferenceError`
  or `RangeError` raised inside Trident's code (a view, an assertion helper) marks the test
  unassessed, with the error as its reason. A candidate's refusal that the runtime
  re-throws is a plain `Error` and stays a failure, as does an error raised in the
  candidate's own code.
- **A jison parser's `parse()` returns `true`.** It is protocol, like the generated
  constants, so an accepted candidate parse returns `true` through `parse()` and
  `parser.parse()`.

The same audit found views that misread what a project records: bridged requirement
models returned as plain objects instead of Maps, `linkStyle default` dropped from
flowchart edge lists, Kanban section icons dropped, tree-view directory slashes not
restored, and generic fallbacks that returned nothing for Loom's and Latias94/merman's
mindmaps. Those are fixed or now unassessed. Most remaining failures of that shape are
genuine: a parser that does not accept `;` between statements returns no edges, and the
test fails reading the first one.

Langium AST tests get reviewed AST views where a model can express the AST. An accepted
parse with no reviewed view is still an AST of the right
type, so tests that check only `$type` are assessed, while every other field is a gap.
Unknown schemas and import or transport errors remain explicit per-test gaps;
`scripts/fidelity-gaps.ts` lists them per project and cause.

**The reference path defines the scored population.** The control is the public
Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact --> package behind the same import substitution the candidates get. In the
current collection <!-- fact:fidelity-expanded -->6,439<!-- /fact --> callbacks expanded: Mermaid passes **<!-- fact:fidelity-population -->3,676<!-- /fact -->**, the scored population;
<!-- fact:fidelity-unqualified -->2,679<!-- /fact --> are reference-unqualified and <!-- fact:fidelity-skipped -->84<!-- /fact --> upstream-skipped. 15 of the <!-- fact:fidelity-files -->352<!-- /fact --> selected files
do not load and 52 files remain outside the core Vitest runner.

Most of the earlier unqualified callbacks were reference-adapter defects, now fixed:
the adapter had no example diagram for the families added to Mermaid since its list was
written (agentflow, railroad and its EBNF/ABNF/PEG variants, usecase, treeView,
cynefin, venn, wardley, swimlanes; eventmodeling's header was misspelled);
`addDiagrams`, `setLogLevel`, `Diagram.fromText`, diagram definition modules and
Chevrotain parser modules were unbound; a test's own `vi.spyOn` mock was wrapped; and a
commented-out `log.debug` call marked every test in its file as using the unavailable
logger. The suite now runs from Mermaid's repository root on the locked runtime that
`upstream:prepare` builds from Mermaid's own lockfile, as Mermaid's CI does. Together
these raised the scored population from 2,894 to 3,602 and cut unloaded files from 23
to 15 (`sequenceDiagram.spec.js`, 157 callbacks, now loads).

The 2,034 callbacks Mermaid's public package still cannot pass test Mermaid's
internals rather than its parse results: rendering, layout and drawing helpers (841);
diagram-module internals such as lexers, member types and renderer state (537); host
API, configuration, utilities and docs tooling (399); themes, palettes and styles
(231); other (26). The 15 unloaded files fail at import on the same kind of internal
(theme tables, ELK algorithm lists, Langium validators and value converters, the
examples packages) or on Mermaid's own YAML-schema build plugin. Reaching them would
mean running Mermaid's private source, which tests Mermaid's implementation rather
than behaviour another implementation could match; no participant, Mermaid's public
package included, can pass them. They are accounted for outside the scored
population, as the portfolio definition allows, and reported beside the table.

**Drawing Correctness checks labels.** A case passes when every label named by its
reviewed source facts is visibly shown and no raw Mermaid syntax is shown. SVG
labels require browser visibility, canvas, clipping and resolved-paint evidence.
Unsupported paint profiles stay unassessed. Terminal matching preserves text
order and joins wrapping inside observed boxes. Empty, error, echoed or zero-size
outputs are nonpasses; the empty-diagram SVG case requires no painted ink.
Edges, arrow direction, layout quality and authored style matching are not
scored. The collection leaves <!-- fact:drawing-unassessed -->186<!-- /fact --> of
<!-- fact:drawing-rows -->4,318<!-- /fact --> results unassessed. A chart naming no
labels is checked for raw-syntax leakage alone.

PNG is not part of Drawing Correctness. OCR found every label in only 43 of 127
Mermaid PNGs whose source SVGs pass 124, so a PNG score would mostly measure the
OCR. Mermaid Flutter, which only outputs PNG, has no Drawing result.

Broad assessment and original-test operation coverage are still incomplete; calling
the whole benchmark effort finished would be premature. Every project now has a
Fidelity binding. The remaining work is to map more native model fields in the schema
views (most bridged projects' unassessed callbacks are fields the generic view does not
map), reach more Mermaid internals through the reference adapter, and run the
unexpanded and outside-runner tests. The combined table displays score
ranges; an exact overall score remains unavailable while required measurements are
missing.

## Evidence and verification

Results are verified by re-running them, not by archiving rendered outputs. Each
published result is backed by four small, committed things:

1. **The frozen version list:** the exact release or source revision of every
   project, resolved once per campaign (`docs/evidence/benchmark-campaign-2026-11-06/versions.json`
   and `catalog.json`).
2. **The pinned inputs:** the Mermaid documentation commit for DaveBench, the 127-case
   Drawing corpus in the repository, and the Mermaid test-suite commit for Fidelity.
3. **The code commit** that collected and scored the result.
4. **The numeric results:** per-run counts and times for DaveBench, and per-case or
   per-file outcomes for Drawing Correctness and Mermaid Fidelity.

Anyone can check a result by preparing the same frozen versions and running the same
commands. On 3 November that reproduced every count the changes did not touch: every
DaveBench completion count and Fidelity's 2,894 qualified tests. Re-running is also
how a scoring change is applied; the full label-based Drawing collection takes a few
minutes.

Rendered SVGs, PNGs and terminal text are not kept. The 605 MB raw archive of the
1 November campaign was discarded rather than published. That campaign measured the
superseded benchmark set; its tables and report receipts remain on the
[`evidence/full-campaign-2026-11-01`](https://github.com/adewale/trident/tree/evidence/full-campaign-2026-11-01)
branch as a historical record.

## Detailed results and numeric inputs

- [Campaign evidence](../results/release/README.md)
- [DaveBench numeric results](../results/release/report.json)
- [Drawing Correctness numeric results](../results/release/drawing-correctness.json)
- [Mermaid Fidelity numeric results](../results/release/mermaid-fidelity.json)

`results:snapshot` reads these numeric results for the landing page and the
generated numbers in the docs. Superseded 2 and 3 November results and the legacy
results snapshot remain in Git history.

## Current project participation

The [league tables](../RESULTS.md) list measured projects and setup gaps for each
format. A scored result can include failures. It does not mean every input passed,
every output was assessable, or the project has complete benchmark coverage.
Drawing has <!-- fact:drawing-unassessed -->186<!-- /fact --> unassessed cases.
Fidelity's unmapped operations and unqualified reference callbacks remain
coverage work. The synthesis keeps missing measurements as score ranges.
