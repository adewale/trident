# PR #37: adversarial audit

Three independent reviewers examined PR revision `c3be466c32b639b6ec80aab1abdc4f2edc012491` and its retained evidence on 28 October 2026. Nash reviewed measurement validity, Linnaeus reviewed the runners, and Dalton reviewed publication against Trident's reporting rules. The reviewers did not alter or rerun the original campaign. The parent agent checked and remediated their findings.

## Findings

| ID | Severity | Confirmed finding | Consequence for the retained results | Remediation / verification |
|---|---|---|---|---|
| A01 | P1 | Pele render-update reinstalls the original source before every timed call | Each positive cell has 9 changed and 6 unchanged measured replacements; the update column does not measure 15 alternating transitions | Prime once per phase; retain previous/next source identities; regression check for every update transition |
| A02 | P1 | View repeats force an unnecessary second frame | 44.01 ms is the flowchart's forced two-frame observation, not its required unchanged-rebuild latency | Wait for an extra fit frame only on a fresh/changed source; record awaited frame count |
| A03 | P2 | Negative Pele render-repeat/update inputs can throw during preparation | 84 raw rows, including 60 measured-index rows, never reach their declared timed call | Separate preparation from measured-call failures; preserve intended source and call-start state |
| A04 | P1 | PELE_MODULE accepts unverified bytes | A different artifact can bypass the advertised version pin | Compare selected bytes with the installed pinned Pele 1.9.0 entry; retain artifact digest |
| A05 | P2 | Subprocesses and browser evaluations lack deadlines | A stall can prevent a terminal record and block the campaign | Process supervision, timeout/crash records, metadata before work, browser cleanup |
| A06 | P2 | Count-only validation accepts duplicate sample identities | Replacing all 6,975 main measured sample indices with zero still passed the old validator | Check the exact expected identity set and reject duplicates, missing and unexpected IDs |
| A07 | P2 | Check-then-write guards allow concurrent writers | A second run can truncate or interleave evidence | Atomic run reservation; duplicate-writer regression check |
| A08 | P2 | Launchers build for the host but assume an x64 output path | Linux ARM64 can build and then fail to launch | Declare and check the supported architecture before building |
| A09 | P2 | Framework errors need not reach the row's async catch | Nonblank pixels can accompany a Flutter build/layout/paint error | Associate framework/uncaught errors with the active sample and reject painted success |
| A10 | P1 | The PR names a local archive without a public review destination | Reviewers cannot inspect the raw data or rendered evidence from the PR | Publish a durable dated evidence asset and link normal-style scorecards from the PR/docs |

## What remains valid

The advertised APIs were invoked directly in native Flutter release and Chromium. Source and dependency pins for the retained run are recorded. The audit reproduced the descriptive medians and found no clock-domain or raster-finish arithmetic defect: successful measured Diagram records join one frame, while legacy View records join two. Both selected negative sources are rejected, although some declared repeat/update operations never began. All 25 post-launch first-use records produced nonblank output.

The original campaign has 10,105 records, of which 9,765 belong to the main campaign. The main campaign contains 9,681 started timed operations and 84 preparation failures. Main measured-index rows total 6,975, of which 6,915 started their timed operation. These are observations, not independent diagrams or semantic passes.

## Limits that fixes cannot repair retrospectively

The historical data is unchanged. Runner fixes do not convert old observations to the revised protocol or replace the affected editing columns. Native widget captures, offscreen SVG raster checks and selected DOM screenshots qualify different output paths; View controls can contribute nonblank pixels. No full semantic-fidelity check was performed. Manual inspection found native pie corner marks and clipped large fixtures; those findings are qualified observations, not a diagnosis of the responsible layer.

Fixed ordering, validation-heavy pacing and three small rounds prevent calibrated speedup or throughput claims. Different output dimensions, fonts and completion boundaries prevent a cross-runtime latency ratio. The source changes are verified separately; they are not a new full benchmark campaign.

## Better comparison

Use separate public-interface scorecards for invocation coverage, qualified output and descriptive within-interface cost/scaling. For a future head-to-head test, define the same completed product output first: a fixed-size encoded PNG or verified composited frame, with matched viewport, pixel ratio, fonts, fit/cropping policy and source transitions. Measure that boundary end to end in each host, keep stage timings separate, counterbalance order and add A/A controls. Until that evidence exists, the shared-work comparison is unavailable.

## Remediation verification

Corrected source producer: `a8b8db13c5242b52076b0f05edb60d3ba742896c`.
Invocation witness commit: `26ad0f91f2f2f6e530f3c23177011e2fa3ce76b9` (source unchanged from the producer).

All ten findings have a documented disposition: A01–A09 are addressed in the revised runner/guards, and A10 is addressed by the dated public evidence publication linked from the PR and docs. The legacy dataset and its affected workload columns remain qualified; they were not rerun or repaired by rewriting raw records.

The focused suite has 23 passing tests, including wrong-module and tampered-installed-entry rejection, invalid-original/valid-update behavior, timeouts and detached-child cleanup, duplicate-writer rejection, exact identity validation and immutable publication checks. The duplicate-ID regression fails when the old count-only guard is restored. Native release compilation and Dart static analysis pass. The unmodified core suite could not start because its dispatcher requires Bun 1.4+, which is not installed.

Separate runtime controls verify 36 painted native flowchart rows, nine retained native invalid-source errors, an injected framework error row, 24 painted browser flowchart rows and six browser negative rows that reach the timed call. All measured source updates change source identity; native View repeat rows await one frame. The independent native concurrent-writer check produces one row and one reservation rejection. A final browser invocation verifies the published Pele digest and paints the named input. Display-startup verification failures are retained separately, with no imputed timing.
