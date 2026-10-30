# Campaign workflow verification

This bundle records preparation, budget/resume, publication and shipped-kit checks for the workflow cleanup. B0 remains uncollected. None of these bounded checks is an ecosystem quality or speed ranking.

## Generated report comparison

**Claim:** the same owning records now produce ranked tables without transcription, and Mermaid ASCII retains its catalog identity.

- Base: `1c7fcb22ed843734154942208abad80c77577b0d`; [actual generated output](before/RESULTS.md). The importer produces zero tables and loses Mermaid ASCII's observation groups.
- Head: `cf8062ddaba0e32c212f8c39627cf1f9e2fa4870`; [actual generated output](after/RESULTS.md). The importer produces 15 tables, preserving public interfaces and both projects' observation groups.
- Named input: `bounded-source-release-smoke`, collected at `cc9a897e63bbbf133c8b6ebfb593ad2f96094e16`. Both generators read the same controller, empty initial snapshot and owning observations. [Hashes and reproduction command](comparison.json); [raw controller](raw-source/report.json); [owning result](raw-source/community/result.json).

Review the new metric tables and Mermaid ASCII's recorded evidence. These are the production Markdown generator's outputs; there is no separate screenshot renderer. Comparable numeric rows receive ranks. This two-brand smoke has different public interfaces, so its tables do not establish a winner between Pele and Mermaid ASCII. The mixed-case reporting regression and inventory/ranking tests provide independent checks.

The original pilot's [base description](https://github.com/adewale/trident/blob/1c7fcb22ed843734154942208abad80c77577b0d/BASELINE.md#L125) incorrectly reports no semantic-complete cases. The [corrected reduction](corrected-pilot.md) reads the original owning reports: one Pele flowchart case completed its declared semantic checks. Original raw evidence at `a43c75361a99e41fa337a477602eaaa3b30bfc70` remains unchanged.

## Workflow checks

| Check | Recorded result | Scope |
|---|---|---|
| Canonical preparation | 39 artifacts; no admission errors; 1,089 compatibility inputs | Adopts the reviewed 29 October artifact freeze and retains its cutoff. All 54 portable cases remain in inventory. |
| Real budget/resume | 13 completed units retained unchanged; flowchart finished; scaling still paused | Pele pilot at `f6073b04e85d6b118dc12e48495f6d2d07ff42a2`; two recorded allowance windows. [Verification](resume-proof/verification.json). |
| Source collection/reporting | 40 passed observations; eight inapplicable; zero failed | Nine bounded inputs on actual Pele SVG and Mermaid ASCII terminal artifacts. No full compatibility or timing claim. |
| Extracted Node kit | Four declared cases passed output admission and their semantic checks | Flowchart, label edit, configuration reset and invalid recovery on Pele. [Receipt](release-check.json). |

The release check ran at `cc9a897e63bbbf133c8b6ebfb593ad2f96094e16`, before the later paint-budget and report-identity corrections. Those paths are covered by their focused regressions and the full suite. The portable kit and source/terminal smoke invocation code are unchanged by those corrections.

[`preparation-summary.json`](preparation-summary.json) identifies the current canonical manifest and its producer check. [`preparation.json.gz`](preparation.json.gz) retains the index; executable dependencies remain in the prepared workspace at their recorded paths. The small review bundle is not a replacement installation cache.

[`workflow-raw.tar.gz`](workflow-raw.tar.gz) retains the bounded source campaign, kit observations, commands and logs. Raw records retain original absolute paths. To regenerate the comparison on another machine, restore the archived `source/` directory at the recorded controller path, then run the command in `comparison.json` at the named base/head revisions. The result reader needs no renderer installation. [`EVIDENCE-SHA256SUMS`](EVIDENCE-SHA256SUMS) covers review artifacts; [`SHA256SUMS`](SHA256SUMS) covers the actual shipped-kit test archive. No release was published.

## Regression review

The [regression logs](regressions/) show failures when the relevant fix is removed or the original defect is exercised. They cover pilot totals, automatic tables, checkpoint reuse, archive validation, release-CLI binding, legacy cold qualification, one-call invalid admission, CLI output bindings under GNU time, compiled cutoff versions, paint-budget propagation and mixed-case project IDs, and separate unranked inapplicable/skipped counts.

The review also corrected resume directory handling, restored recorded invocation options, preserved reused measurement dates, retained untimed admission observations, and removed a redundant community report path. Tests retain failures and unavailable observations rather than converting them to zero or pass.

Full-suite, offline fixture, static and snapshot logs are under [checks/](checks/). Final-head GitHub CI belongs to the source PR. Original measurement dates and source revisions above remain literal; generating this bundle does not create new benchmark results.
