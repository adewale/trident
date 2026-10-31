# Initial benchmark baseline

Trident's first release baseline must identify **what was checked, on which
artifact, with which inputs and observer**. A successful public call is invocation
coverage. It does not establish an accurate drawing, conformance or qualified
performance. The public historical campaigns remain useful evidence under their
original protocols; they are not the new accuracy baseline.

[Release process](RELEASE.md) · [Benchmark definitions](BENCHMARKS.md) ·
[Evidence and reports](REPORTING.md) · [Fair comparisons](FAIRNESS.md)

## Verify Trident with the smallest cohort

The fixed [harness profile](qualification/harness-profile.json) covers six
artifacts chosen for different execution mechanisms:

| Project | Pinned version | Execution mechanisms exercised |
|---|---|---|
| Mermaid | 12.2.0 | Browser SVG, SVG-to-PNG conversion and public model |
| Mermaid ASCII | 1.6.1 | Native terminal CLI |
| Agentic Mermaid | 0.4.1 | Node SVG/PNG/terminal, package CLI and alternate public model |
| Mermaid Flutter | 0.3.2 | PNG-only worker |
| Merman | 0.9.2 | Browser WASM, native Node engine and native release SVG/PNG/terminal CLI |
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
create a pass. The retained six-artifact run verified all 16 invocation paths.
That result establishes executable transports only, under its recorded producer.
It does not establish correct input propagation, complete drawing facts or a
final-head release check.

## Establish accuracy before collecting comparative timings

| Workload | Frozen input provenance | Evidence needed for a score | Current limit |
|---|---|---|---|
| DaveBench SVG and PNG | All 548 syntax-documentation occurrences, 546 distinct sources, at Mermaid commit `1fb7869866dd619168d840291c9c54b4f129758b`. | A complete source contract and every required fact checked against each actual output. | 544 drawing contracts and one configuration-only fence are transcribed; three source interpretations remain pending. Many complete contracts still need qualified output observers. |
| Mermaid public tests | Unchanged callbacks from the same pinned Mermaid source. | The original source and substituted public reference must both pass before peer comparison. | The qualified scope is 22 parse/detector callbacks. The 4,060-declaration census is not 4,060 executable or qualified peer tests. |
| Terminal project examples | 120 frozen inputs from project docs, tests, issues and PRs, with licenses and source changes retained. | All required terminal facts observed on actual display cells; invalid rejection controls counted separately. | The full inventory declares 318 required facts across 116 positive drawings and four rejection controls. A diagnostic subset has supported representations; its size is not a count of verified passes. |
| Feature cases and public models | Independently authored cases and separately labelled AM-origin/external cohorts. | The same required drawing or public-operation postconditions for each compared project. | An unsupported observer, missing binding or failed prerequisite keeps the corresponding claim unresolved. |

The [source audit](docs/docs-source-expectations.md), [PNG proof rules](docs/png-correctness.md),
[public-test scope](docs/mermaid-public-conformance.md) and
[terminal observer](docs/terminal-correctness.md) describe the remaining work.
A transcriber-complete flag records enumerated source obligations; it is not an
independent drawing judgment. SVG and PNG have separate correctness denominators.
Decoding, nonblank pixels and reference agreement cannot supply missing facts.

Use retained output bytes first. An observer fix normally needs a recheck, not
another renderer call. Collect an affected output again only when its artifact,
source, required resource, invocation or missing witness requires it. Resolve
ambiguous source intent independently; do not choose an expected answer from a
candidate's output.

## Freeze and publish B0

Prepare one immutable artifact and input inventory for the comparative campaign.
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
`timing:qualify` command checks that evidence; old return clocks cannot be upgraded
by changing their label.

Later releases reuse unchanged evidence with its original date and identities.
Changed artifacts, inputs, observers or transports require only the affected
checks. A new protocol needs new evidence or an explicit bridge comparison; a
rolling `RESULTS.md` update does not rewrite B0.
