# Initial ecosystem baseline

**Reconcile B0 (`ecosystem-b0`) before the first public 0.1 release.** The
[30 October full campaign](https://github.com/adewale/trident/blob/8b2404b0bf2940e571ca0e14e54eeff0517a98ca/README.md)
and its raw evidence are public. Baseline applicability reconciliation and
qualification remain pending. B0 covers every normally selected brand and applicable benchmark.
A broken release, unsupported operation or missing Trident binding stays visible.
Projects do not have to pass every check for the harness to ship.

[Release checklist](RELEASE.md) · [Benchmarks](BENCHMARKS.md) ·
[Fair comparisons](FAIRNESS.md) · [Result tables](REPORTING.md)

## Prepare once

Choose one UTC release cutoff. Preparation resolves stable artifacts available at
that cutoff, applies the lineage/branding policy, freezes input bytes and seals
actual artifacts and dependencies. Immutable source revisions apply where no
published benchmark component exists. New CLI releases need reviewed archive
hashes and bindings; a source build cannot silently replace a published executable.
Prereleases and source candidates remain separate from release results.

```sh
bun commands.ts bench --all-projects --suites community,docs,fidelity,native-fidelity,portable --profile full --plan
bun commands.ts bench --prepare --all-projects --suites community,docs,fidelity,native-fidelity,portable --profile full \
  --cutoff 2026-10-29T18:42:38Z --out /evidence/b0
```

The preparation's single entry point is `/evidence/b0/preparation.json`. It owns
hashed catalog, project/browser snapshots, release metadata, input inventories,
applicability plan and dependency identities. Reuse that manifest with `--prepared`;
collection performs no latest-version lookup or artifact acquisition. Reviewed
existing snapshots can be adopted with the existing `--community-catalog`,
`--community-prepared` and `--community-browser-prepared` options during preparation.
Browser snapshots must match the selected artifact and its public binding; a
valid snapshot from an older release cannot supply current-release evidence.
There is no sequence of manually repaired "final" manifests.

The reference remains Mermaid 12.2.0 with the source and tools in
[tool-versions.json](tool-versions.json). Its original tests run once in their
qualified source/runtime, separately from peer scores. A newer Mermaid product
needs its own reviewed identity. Mermaid Dart and Mermaid Flutter are separate
brands; unbranded descendants and applications remain excluded. Validator-only tools remain outside renderer scope, including Rusty Mermaid.
Its 0.42.0 missing-runtime receipt remains historical evidence.

The dated [29 October preparation archive](https://github.com/adewale/trident/tree/a43c75361a99e41fa337a477602eaaa3b30bfc70)
retains the original 39-artifact freeze and raw v6 pilot evidence. Its hard-coded
semantic aggregate and prose were wrong. The [regenerated pilot report](docs/b0-pilot.md)
and [machine-readable reduction](docs/evidence/b0-pilot-summary.json) read the owning
reports and supersede that aggregate. The original bytes and dates remain unchanged.

## Work required

Use the frozen applicability plan for exact project counts and configured,
missing-binding and inapplicable cells. Preserve every cell when reconciling the
campaign; configuration and six-input support checks are not benchmark scores.

| Benchmark | Required workload |
|---|---|
| Mermaid Compatibility | Full committed corpus: 1,081 feature inputs, with render and parser-only populations separate, plus six legacy diagnostics and independent invalid controls. |
| DaveBench: Documentation Examples | Complete pinned syntax-doc inventory: 548 occurrences, retaining repeated and distinct sources. |
| Diagram Meaning | Full authored input and criterion ledger; public-model facts and SVG paint remain separate. |
| Model and Editing Contracts | Shared reviewed criteria, with API-specific checks separately identified. |
| Render Cost and Scaling | All 54 portable cases, including 51 positive inputs and three invalid controls; no speed score for invalid inputs. |

Mermaid’s original tests validate the reference separately when its pin/runtime
changes; existing owning evidence may be reused. Assertion Replay is retired from
new comparative campaigns. Historical B0 observations retain their original scope.

Freeze [external repository examples](corpus/external-sources.json) separately from
the AM-origin regression corpus. Keep the equal 20-file repository cap, pinned
commits, licenses, duplicate provenance and repository contributions. Supply the
frozen file with `--external-inputs` during preparation; it becomes a separate
cohort under the same collection budget. Never pool the cohorts into one headline.
Public development inputs are not a validated production holdout.

## Pilot and sampling

The revised portable protocol is `portable-svg-processes-v7`: **six independent
rounds, 31 warm sample means and five fresh processes per A0/A1/B replica per
positive case and round**. Six rounds permit the implemented finite 95% median-ratio
interval, under its independence assumptions. Five rounds cannot supply that
interval regardless of repeated-call count. Intervals and A/A noise checks remain
visible; unstable timing is withheld. No individual-call p95/p99 claim is made.

For the current ten portable Node SVG projects and 51 positive cases this plans
**45,900 cold launch slots**, before admission exclusions. The earlier 39-project
selection planned 50,490 slots across eleven Node SVG projects; sampling is unchanged. All 54 cases
remain in the inventory; a rejected family probe marks its cases unsupported.
Invalid controls run once. Cases with failed or blocked admission retain their
outcomes and receive no further timing/resource jobs.
Optional model gaps cannot erase independently admitted SVG-only observations;
full semantic claims still require their declared evidence.

This revision changes sampling before B0 collection. Earlier v6 measurements and
their 20-sample qualification minimum retain their identity. The old pilot cannot
be relabelled v7 or imported as B0. Run the supported bounded pilot on actual artifacts:

```sh
bun commands.ts bench --prepared /evidence/b0/preparation.json --pilot \
  --budget-minutes 30 --out /evidence/b0-pilot
```

The pilot gives every eligible portable project the small flowchart before the
class-scaling case, using a fixed schedule. Its summary is generated from owning
reports. Freeze the adopted sampling decision and allowance before collecting B0;
never reduce samples after seeing a campaign's results to claim completion.

## Collect and resume

```sh
bun commands.ts bench --prepared /evidence/b0/preparation.json \
  --suites community,docs,fidelity,native-fidelity,portable \
  --budget-minutes 1440 --out /evidence/b0
# An explicitly recorded additional allowance, preserving completed work:
bun commands.ts bench --resume --budget-minutes 120 --out /evidence/b0
```

One absolute deadline covers the external cohort and seven-suite campaign.
Collectors check it at safe job/case/round boundaries; active workers retain their
own deadlines. Portable checkpoints retain completed jobs; DaveBench retains
completed project-rounds. Other suites reuse completed project records and retain
interrupted attempts. Resume validates artifact, producer, workload and sampling
identities; it cannot change the comparison. It records each allowance and window,
rather than silently restarting the clock for another cohort.
Resume restores the recorded invocation options; supply only `--out` and an
optional additional `--budget-minutes`.
A forced fresh campaign reuses its own completed records when resumed.

Run one active measurement worker at a time. Finish builds, downloads and tests
before timing. Unstarted and interrupted work remains incomplete. A 24-hour
allowance is a collection control, not a promise of completion. Resume or record a
named release exception with its reason, tracking link and reduced support claim.
An exception cannot turn unrun work into measured evidence.

## Publish and use the baseline

Publish a permanent B0 index with the frozen manifest, applicability reconciliation,
owning attempts, raw observations, failures, qualifications, runtime/environment
identities, actual measurement windows, archive and checksums. Generate comparative
tables from those records using [the publication commands](results/README.md).
Keep literal denominators and matched successful input IDs beside timing; a new
failure must not disappear from an expensive case and make a project look faster.
Node, browser, CLI, terminal and PNG clocks keep their own scopes and units.

B0 is ready when every applicable cell has owning execution evidence or a named
exception, all gaps and interruptions are accounted for, and reductions reconcile
with the frozen inputs. Budgets, import success and pilot checks do not satisfy
that gate. Link B0 from the release notes; rolling RESULTS.md updates never amend it.

Later releases assess compatibility with B0. Reuse preserves original dates and
identities. New versions need their own measurements; changed protocols, inputs,
observers or runtimes require affected measurements or a declared bridge run.
Unchanged evidence does not require another full ecosystem campaign. New brands
receive their own dated initial evidence without rewriting B0.
