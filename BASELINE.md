# Initial ecosystem baseline

**B0 (`ecosystem-b0`) is required before Trident's first public 0.1 release.** It
is the frozen comparison point for future project versions and harness changes.
Collection is pending. This document defines the required work; it supplies no
new scores or timing qualification.

B0 covers every normally selected brand and every applicable benchmark. The
current results overview combines dated campaigns, candidates and observer
versions; those records keep their identities and cannot be renamed B0.

[Release checklist](RELEASE.md) · [Benchmark contracts](BENCHMARKS.md) ·
[Comparison rules](FAIRNESS.md) · [Reporting](REPORTING.md)

## Freeze the selection and artifacts

Record one UTC release cutoff and the exact harness revision, observer protocols
and dependency closure. Resolve each selected brand's latest stable published
artifact available at that cutoff, then seal the actual bytes and dependencies.
Use immutable source revisions only where no published benchmark target exists.
Keep prereleases and unreleased candidates in separate studies. A broken release
stays a recorded failure or skip; do not choose an older release after seeing its
outputs.

Create a frozen catalog with the selected versions and bindings, preserving the
source catalog identity and exclusion reasons. Pair it with admitted prepared
artifacts. The existing catalog pins and registry metadata alone are not a
baseline artifact manifest. Resolve once during preparation; collection uses
frozen artifacts without latest-version lookups or acquisition.

The language reference has a separate role: Mermaid 12.2.0, parser 2.0.1, jsdom
26.1.0 and ZenUML addon 1.0.1 from [tool-versions.json](tool-versions.json), with
source `1fb7869866dd619168d840291c9c54b4f129758b`. Keep its own tests and artifact
identity separate from peer scores. Any later Mermaid product release differing
from the reference needs its own admitted product identity.

The initial selection follows the [lineage/branding policy](FAIRNESS.md#descendant-selection).
Mermaid Dart and Mermaid Flutter remain separate brands with shared-core ancestry
recorded. Descendants without distinct branding, zero-ahead versions, ordinary
shared-engine bindings and whole-editor applications remain excluded. Rusty
Mermaid 0.42.0 stays skipped for its missing published runtime; a source candidate
cannot replace it.

## Account for every project and benchmark

At catalog revision `8411ea8c6436787d4bbe32db517d59f1b2edb259`, 89 entries include
40 core identities and 39 normally scheduled projects. These configuration counts
are a planning snapshot, not measured success or a quality rank. Regenerate the
plan at the actual freeze revision:

```sh
bun commands.ts bench --all-projects --profile full --rounds 5 --plan
```

Planning performs no acquisition or rendering. It does not establish that an
artifact builds or a public call succeeds. Formats and Node/browser/CLI transports
produce additional owning observations within each project/suite pair.

| Benchmark | Configured or conditional projects | Required workload |
|---|---:|---|
| Mermaid Compatibility | 39 | Full committed corpus; rendering, parser-only inputs and invalid controls counted separately. Freeze repository examples as a separately reported cohort. |
| DaveBench: Documentation Examples | 17 | Complete pinned syntax-doc inventory, retaining occurrences, unique sources and family breakdowns. The current recorded inventory has 548 occurrences. |
| Diagram Meaning | 17 | Full authored input/criterion ledger; actual SVG ink assessed independently of optional models. |
| Render Cost and Scaling | 11 | All 54 portable cases: 25 family, 18 scaling, eight adversarial and three invalid controls. Invalid inputs earn no speed score. |
| Model and Editing Contracts | 3 | Shared reviewed criterion ledger; API-specific checks reported separately. |
| Mermaid Assertion Replay | 3 | Complete pinned original-test inventory, with translation exclusions and unavailable work retained. |
| Mermaid Reference Tests | 1 | Genuine original runner for the pinned reference, executed once. |

The snapshot has 273 project/suite cells: 91 configured/conditional pairs to
attempt, 78 missing adapter/projection bindings, and 104 inapplicable or
reference-only pairs. Preserve those distinctions. A missing Trident model binding
is not evidence that the product lacks a model API, and optional models do not
become mandatory for renderers.

Before collection, classify every cell and record its input/criterion denominator.
A configured cell needs owning execution evidence for its frozen workload; a plan,
successful import or six-input invocation check cannot replace it. Keep actual
failures, unsupported operations and blocked upstream artifacts. Harness or local
environment blockers require remediation or a named release exception with its
reason, tracking link and reduced support claim. Neither an exception nor a budget
stop permits a claim that an unrun workload was measured.

## Preserve workload provenance

Freeze input bytes, expectations, case IDs, configuration, licenses and their
producer identities before examining participant output. At the planning snapshot,
the AM-origin compatibility corpus contains 1,081 feature workloads: 724 render
inputs and 357 parser-only inputs, plus six legacy timing cases. The pinned
reference determines the positive-render population before collection; unknown
intent or admission cannot silently reduce its denominator.

Also freeze [the eight-repository external-input policy](corpus/external-sources.json)
with its equal 20-file cap, pinned commits and licenses. Keep it separate from the
AM-origin regression cohort. Retain duplicate provenance and report unique-source
and occurrence counts, repository contributions and diagram families separately.
Prolific related repositories must not acquire extra influence through a pooled
headline score. Public development examples are not a validated production holdout.

For timing comparisons, record the declared case population and the exact matched
successful case IDs alongside full coverage and failures. Preserve these sets for
future comparisons. A new failure must not disappear from an expensive case and
make the candidate look faster. Pair-specific matched sets do not justify a pooled
cross-project ranking with different denominators. Avoid reducing the study to an
all-project intersection of a few easy examples.

## Pilot, then freeze sampling and budget

Separate preparation, public-call/invalid-control admission, functional collection
and timing. Use the same admitted artifacts throughout. Finish builds and tests
before timing and run one active measurement worker at a time.

The proposed B0 portable median profile is five rounds, 31 warm sample means and
five fresh processes per identical A0/A1/B replica per round and case. Across the
current 11 projects and 54 cases it plans 44,550 fresh launch slots, compared with
178,200 for the existing full profile's 20 cold samples. Actual launches can be
lower when declared admission gates withhold cases. Keep first-use, import, warm
tracks and resource observations separate; this profile makes no cold p95/p99 claim.

Run a bounded pilot against the actual artifacts before freezing that proposal.
Record its elapsed time, repeatability, exclusions and proposed collection budget.
The frozen manifest must name the adopted sampling profile and budgets for
preparation, pilot and collection, including the action taken at exhaustion. Pilot
results are diagnostics, not B0 scores. Change a proposed profile before collection;
never reduce samples or relax an A/A gate after seeing the results.

The public portable `run` command supports `--rounds 5 --samples 31 --cold-samples 5`;
retain the project's reviewed adapter, binding and public options in the command
receipt. **`bench --profile full` still selects 31 warm means and 20 cold samples.**
It does not select this proposed B0 profile. Use explicit portable invocations if
the five-cold-sample profile is adopted, and retain the other benchmarks' own
protocols. Do not change the existing full profile or call the reduced profile full.

Keep SVG-return, browser SVG, native PNG, terminal API and whole-CLI clocks in
separate comparable cohorts. Record machine, OS, runtime, browser, fonts and
configuration; rotate/reverse participant order where the collector supports it
and retain the actual schedule. Apply the declared A/A gates and uncertainty.
Noisy or unqualified timing stays withheld, while independently verified functional
results remain usable. A throughput or speed claim needs its own admitted work;
the six legacy core clocks are diagnostics.

Budgets are collection controls, not completion promises. The existing campaign
budget stops between boundaries; an active worker retains its declared deadline.
Unstarted or interrupted work remains incomplete. Resume or record a named
exception rather than shrinking the frozen workload to claim completion.

## Publish the immutable evidence

The publication must contain a permanent B0 index and a manifest with:

- Baseline ID, release cutoff, freeze revision, observer/protocol identities and
  complete selected/excluded project and applicability ledgers.
- Actual package versions, hashes, dependency closure, source/build recipes,
  reviewed bindings and public invocation receipts for every admitted artifact.
- Frozen input/criterion inventories and their provenance, configuration, sampling
  profile, A/A gates, budgets and actual collection/measurement windows.
- Machine/toolchain/font identities, actual schedules, raw observations, failed
  outputs, reductions, skips, adapter gaps, withheld/incomplete cells and exceptions.
- Immutable evidence URLs and checksums, independent reconciliation results and
  the source revision of any publication or requalification step.

Retain artifacts or durable retrieval identities so they can be rerun. Store large
raw evidence outside tracked source as described in [results/README.md](results/README.md).
The release notes link the published manifest, evidence archive, checksums and
limitations. Keep the immutable baseline page separate from rolling [RESULTS.md](RESULTS.md).
Updating the rolling page does not overwrite B0 or alter original measurement dates.

Stack-rank each comparable table by its named metric. Ties share a rank; unavailable
or withheld values remain unranked. Keep coverage, painted meaning, optional models,
latency and resources separate. There is no combined winner or support-adjusted
speed score.

B0 is ready when the frozen plan is reconciled against every owning attempt,
exception and applicability disposition, the evidence links and reductions have
been independently checked, and the complete publication is retained. Benchmark
failures need not become passes. Withheld timing does not establish a performance
baseline for that cell. Open-ended missing work cannot be presented as completion.

## Use B0 in later releases

Every Trident release records a baseline assessment in its release notes. Name B0
and any newer cohort, list affected producers, inputs, runtimes and artifact
bindings, and explain evidence reuse, fresh measurements or bridge runs. Unchanged
producer/artifact/measurement identities can reuse evidence with its original date.
A new Trident version number alone does not require another ecosystem campaign.

For a new product version, retain its own B0 artifact and most recent comparable
release. Rerun the old artifact alongside the new one for speed claims. Changes to
hardware, runtime, workload, sampling or observers require a separately identified
cohort and bridge evidence that separates method effects from product changes.
Do not overwrite B0. New brands receive their own dated initial measurements;
they inherit neither a parent's scores nor invented historical results.

A release affecting the frozen measurement contract needs that assessment and the
required fresh/bridge evidence before publication. Packaging and documentation
changes can reference compatible retained evidence while still completing the
exact-head release checks. Each new cohort has its own immutable manifest.
