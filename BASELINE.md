# Initial benchmark baseline

Trident's first release baseline must identify **what was checked, on which
artifact, with which inputs and observer**. A successful public call is invocation
coverage. It does not establish an accurate drawing, conformance or qualified
performance. The public historical campaigns remain useful evidence under their
original protocols; they are not the new accuracy baseline.

[Release process](RELEASE.md) · [Benchmark definitions](BENCHMARKS.md) ·
[Evidence and reports](REPORTING.md) · [Fair comparisons](FAIRNESS.md)

The [current benchmark report](docs/qualification-results-2026-10-31.md)
records the completed minimum cohorts and their remaining unknown facts. It is
qualification evidence for the frozen [B0 tables](results/baseline.json). B0 records
verified counts and explicit limits; it makes no full-accuracy or new 27-project
campaign claim. Its [receipt](docs/evidence/b0/receipt.json) checks the exact
input and outcome files, not just transcribed scores.

B0 is immutable. Its exact API diagnostic and original outcome categories remain
historical evidence when the active benchmark portfolio or grader changes. New
portable behaviour assertions and direct-format reviews carry their own source
and observer identities; they never inherit a B0 pass or overwrite its bytes.

## Verify Trident with the smallest cohort

The fixed [harness profile](qualification/harness-profile.json) covers six
artifacts chosen for different execution mechanisms:

| Project | Pinned version | Execution mechanisms exercised |
|---|---|---|
| Mermaid | 12.2.0 | Browser SVG, SVG-to-PNG conversion and public model |
| Mermaid ASCII | 1.6.1 | Native terminal CLI |
| Agentic Mermaid | 0.4.1 | Node SVG/PNG/terminal, package CLI and alternate public model |
| Mermaid Flutter | 0.3.2 | PNG-only worker |
| Latias Merman | 0.9.2 | Browser WASM, native Node engine and native release SVG/PNG/terminal CLI |
| Termaid | 0.10.0 | Python terminal API |

This is a mechanism coverage set, not an ecosystem league table or a privileged
benchmark cohort. Agentic Mermaid's extra paths make it useful here; they supply
no extra score. Replacing an artifact requires preserving the mechanism it covers.
Mermaid is always the source reference, and Mermaid ASCII is the terminal baseline.

```sh
bun commands.ts verify:harness --plan
bun commands.ts verify:harness --prepared PREPARATION.json \
  --browser-prepared BROWSER_PREPARATION.json --out FRESH_DIRECTORY
```

The profile has **16 execution paths**, including two model paths. Its 14 output
paths each receive one original source, one label change, one invalid input and
one recovery source: **56 output calls**. Model operations are counted separately.
There are no performance warmups or repetitions. These ordinary commands require
no Codex or model API; source reviews and fixtures are retained inputs, not
runtime-generated answers. The collection budget is five
minutes after preparation. Expiry leaves uncompleted paths blocked; it cannot
create a pass. The retained verification covers all 16 paths in two explicit
phases: 14 output paths passed label or decoded-pixel propagation, then both model
paths passed their five scoped postconditions after a Node import compatibility
fix. The 56 completed output calls were reused. Original failed model attempts
remain recorded. This establishes those execution and input-propagation controls;
it does not establish complete drawing facts or corpus accuracy.
[The published receipts](https://github.com/adewale/trident/blob/79777b738e4bb5292a31b11dc405c42f6c90d323/qualification-evidence/README.md) retain both phases and their exact producers.

## Establish accuracy before collecting comparative timings

| Workload | Frozen input provenance | Evidence needed for a score | Current limit |
|---|---|---|---|
| DaveBench SVG and PNG | All 548 literal occurrences at Mermaid commit `1fb7869866dd619168d840291c9c54b4f129758b`: 546 sources after boundary trimming, 547 exact bodies; 546 drawings, one invalid control and one configuration-only occurrence. | Verified correct/incorrect/unknown drawing counts per format, bound to each actual output; invalid rejection separate. | [547 contracts are complete and one is held](docs/docs-source-expectations.md). Current PNG decisions, held facts and native no-image outcomes remain separate. The [summary](docs/evidence/png-remaining-2026-11-01/summary.json) and [all grades](docs/evidence/png-remaining-2026-11-01/current-content-grades.json.gz) retain full denominators; complete accuracy remains unresolved. |
| Mermaid public tests | 154 unchanged callbacks from 37 declarations at the same source pin; historical 41 scope retained separately. | Passed callbacks over the same selected population, with failed/unsupported/binding gaps shown. Both original and public-reference controls must pass all selected callbacks. | The retained `expanded-154-bundle-v2` owns both disjoint parent scopes. The [source manifest and controls](docs/mermaid-public-conformance.md) qualify this API diagnostic, not drawing accuracy or the 4,060-declaration upstream suite. |
| Terminal project examples | [Named active v3](corpus/terminal-active-profile.json): 115 unchanged original drawings, one independently reviewed authored adaptation and four original invalid controls. Original 120 literal sources plus the authored adaptation retain 121 research entries, with the ambiguous original held as diagnostic. | Verified correct/incorrect/unknown counts over 116 drawings, with typed rejections over four controls separately. | Every active source profile has bounded observers. [Retained 18-project results](docs/evidence/b0/normal/terminal-result.json.gz) keep missing/uninspectable outputs unknown; 15 projects were not called on the fresh adaptation. Saved v1/v2 rechecks retain the original corpus. |
| Harness regressions — unscored | 100 AM/Trident-authored feature/edit cases, with sources and old raw evidence retained. | No comparative score. Use focused positive/wrong-output controls and session/configuration checks to qualify the harness. | Repeated reset/rename fixtures do not add benchmark weight. Old outputs with unproved preludes supply no workflow pass; no new workflow campaign is required merely to restore their score. |
| Public Model Contracts — optional | Independently specified public-operation postconditions. | Only the declared API scope, separately from SVG/PNG meaning. | Unsupported bindings and failed prerequisites remain explicit; model results do not fill drawing checks. |

The [source audit](docs/docs-source-expectations.md), [PNG proof rules](docs/png-correctness.md),
[public-test scope](docs/mermaid-public-conformance.md) and
[terminal observer](docs/terminal-correctness.md) describe supported predicates,
independent controls and remaining unknown facts. The [assembled adversarial
audit](docs/evidence/qualification-adversarial-audit-2026-10-31/README.md) records
concrete fixes, retained-output checks and source-population invariants.
A transcriber-complete flag records enumerated source obligations; it is not an
independent drawing judgment. SVG and PNG have separate correctness denominators.
Decoding, nonblank pixels and reference agreement cannot supply missing facts.

Use retained output bytes first. An observer fix normally needs a recheck, not
another renderer call. Collect an affected output again only when its artifact,
source, required resource, invocation or missing witness requires it. Resolve
ambiguous source intent independently; do not choose an expected answer from a
candidate's output.

## Frozen B0 and later results

`results/baseline.json` is the immutable initial reference. Its receipt binds the
frozen input copies, ordinary outcome ledgers, source/observer epochs and owned
raw-evidence archives. `results/latest.json` links its checksum; the normal
`bun commands.ts results:snapshot --check` command checks both snapshots and
their local input/outcome hashes. Later runs update the rolling view, keeping
B0 bytes unchanged. A changed source contract or observer needs an explicitly
qualified comparison; it cannot inherit an old correctness verdict.

B0 freezes bounded, development-exposed evidence. Unknown observations remain in
the denominator and receive no credit. It does not certify all drawings, every
Mermaid test, a hidden holdout or ecosystem-wide speed. Existing timing results
retain their original capture identities; future speed comparisons need a fresh
matched reference and passing A/A controls in the same measurement window.

For a later comparative campaign, prepare one immutable artifact and input inventory.
Keep published releases, explicit source candidates and runtimes distinguishable.
The preparation binds the applicability plan, artifact and dependency hashes,
source contracts, resources, observer and producer identities. Collection reuses
that manifest without acquiring newer artifacts.

Run the selected comparison once the relevant observers are qualified. The
six-project harness profile is sufficient for transport verification; it does not
require benchmarking every ecosystem project after each code change. A requested
broader campaign fixes its time allowance before collection and keeps every
planned cell visible as correct, incorrect,
unsupported, unknown or unrun. Unknown cells cannot be removed to improve a score. Deadline expiry preserves
completed work and marks the rest unrun; another allowance is an explicit
decision, not an automatic restart of the ecosystem campaign.

Publish B0 with its frozen manifest, owning attempts, raw witnesses, observer
results, runtime identities, dates and checksums. Generate stack-ranked tables
from those records. Rank comparable verified counts; show every nonpass category
and literal denominator. Performance requires matched source IDs, equivalent call
boundaries, per-sample checked outputs and passing A/A noise controls. The offline
`timing:qualify` command checks that evidence. The [first-use browser collector](BENCHMARKS.md#qualification-and-collection)
creates new captured calls from a sealed pair when new collection is needed.
Fresh grading can reuse unchanged outputs and clocks; it cannot add missing calls
or upgrade old return clocks by changing their label.

Later releases reuse unchanged evidence with its original date and identities.
Changed artifacts, inputs, observers or transports require only the affected
checks. A new protocol needs new evidence or an explicit bridge comparison; a
rolling `RESULTS.md` update does not rewrite B0.
