# adewale/agentic-mermaid benchmark case study

Version: 0.5.1. Measured 2026-10-30T05:55:50.026Z through 2026-10-30T07:38:46.927Z. Fresh retained observations.

Cases: 54; families: 25; positive: 51; negative: 3. Failed workers: 1; blocked workers: 0.

Timing calibration: 52/155 rows calibrated. Format/text output admission: 50/51 positive cases; missing legacy evidence is not a failure. Declared native-plus-painted correspondence: 7/51 positive cases. Output admission, optional model APIs, painted correspondence and timing calibration are separate observations. No full-semantic performance claim is admitted without all its evidence.

A0, A1 and B use the same admitted artifact. Their differences diagnose measurement variation; they cannot establish a product speedup. Cold imports may prepare in batches, but first API calls execute one at a time after the complete idle barrier. Timings exclude import and qualification. Cases with a prelude report first-final-source timing after that prelude.

Calibration reports a descriptive A/A envelope separately from an exact median round-ratio uncertainty interval. Thousands of calls within five rounds are still only five independent rounds: a finite two-sided 95% sign interval needs at least six. Intervals require independent representative rounds and do not remove systematic host/workload differences. Repeated-source p95 values describe batch means, not individual tail latency.

## Family representatives

| Family | Warm repeated API median (ms) | Format/text-only calibrated | Full-check calibrated | Native + painted criteria |
|---|---:|---|---|---|
| flowchart | 2.4246 | false | false | partial; see case scopes |
| sequence | 2.7393 | false | false | partial; see case scopes |
| state | 2.8372 | false | false | partial; see case scopes |
| class | 8.7543 | false | false | declared criteria complete |
| er | 7.9543 | false | false | declared criteria complete |
| timeline | 6.7824 | false | false | partial; see case scopes |
| journey | 11.8636 | false | false | partial; see case scopes |
| architecture | 9.0522 | true | true | partial; see case scopes |
| xychart | 12.4611 | false | false | partial; see case scopes |
| pie | 5.3121 | false | false | partial; see case scopes |
| quadrant | 6.0113 | false | false | partial; see case scopes |
| gantt | 7.2099 | true | true | partial; see case scopes |
| mindmap | 7.0604 | true | true | partial; see case scopes |
| gitgraph | 8.8272 | false | false | partial; see case scopes |
| radar | 5.6543 | false | false | partial; see case scopes |
| sankey | 6.4558 | true | true | partial; see case scopes |
| c4 | 11.4690 | false | false | partial; see case scopes |
| packet | 5.6142 | true | true | partial; see case scopes |
| kanban | 5.3013 | false | false | partial; see case scopes |
| requirement | 8.9974 | false | false | partial; see case scopes |
| treemap | 5.1968 | false | false | partial; see case scopes |
| ishikawa | 7.6691 | true | true | partial; see case scopes |
| block | 6.4151 | false | false | partial; see case scopes |
| eventmodeling | 9.0683 | true | true | partial; see case scopes |
| zenuml | 7.7231 | true | true | partial; see case scopes |

## Scaling

| Family | Size | Warm repeat median (ms) | Warm calibrated | First-use p95 (ms) | First-use calibrated |
|---|---:|---:|---|---:|---|
| flowchart | 8 | 2.9387 | false | 302.4169 | false |
| flowchart | 32 | 4.9582 | false | 603.7901 | true |
| flowchart | 128 | 11.9161 | false | 566.3652 | false |
| sequence | 8 | 3.2477 | false | 153.9568 | true |
| sequence | 32 | 4.3738 | false | 210.4213 | true |
| sequence | 128 | 10.1604 | false | 982.4228 | false |
| class | 8 | 16.6842 | false | 783.8045 | false |
| class | 32 | 43.9913 | true | 698.5525 | false |
| class | 128 | 178.0982 | true | 1005.9749 | true |
| state | 8 | 3.0969 | true | 947.1227 | false |
| state | 32 | 5.3403 | false | 948.9454 | true |
| state | 128 | 11.5435 | false | 1264.8523 | false |
| er | 8 | 19.6567 | false | 1229.5442 | false |
| er | 32 | 62.2800 | true | 1258.7025 | false |
| er | 128 | unavailable | false | unavailable | false |
| architecture | 8 | 21.1602 | false | 1809.4462 | true |
| architecture | 32 | 54.5942 | false | 900.8884 | true |
| architecture | 128 | 168.2127 | false | 2294.4722 | false |

## Individual cases and fidelity

| Case | Acceptance matches | Format/text admission | Failed / blocked workers | Semantic scope |
|---|---|---|---:|---|
| family:flowchart | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sequence | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:state | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:class | true | passed | 0 / 0 | Declared native + painted checks complete |
| family:er | true | passed | 0 / 0 | Declared native + painted checks complete |
| family:timeline | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:journey | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:architecture | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:xychart | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:pie | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:quadrant | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:gantt | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:mindmap | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:gitgraph | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:radar | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sankey | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:c4 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:packet | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:kanban | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:requirement | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:treemap | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:ishikawa | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:block | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:eventmodeling | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:zenuml | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:8 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:class:32 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:class:128 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:state:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:8 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:er:32 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:er:128 | false | unavailable in retained protocol | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:label-edit | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:parallel-reciprocal | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:nested-groups | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:wide-unicode | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:generated-looking-ids | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:quoted-labels | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:invalid-recovery | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:configuration-reset | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| invalid:unknown-header | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:missing-endpoints | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:unfinished-sequence | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |

## Memory and cost

API RSS/heap snapshots are read before output qualification, at return and after dropping the output and requesting GC. Signed deltas remain signed. Independent import/prelude-only baseline processes are retained. These snapshots do not measure peak native/WASM/GPU allocation. GNU time peaks and CPU, when available, describe the whole worker, including import, driver, GC and later qualification; they are not API-only peaks or provider invoices.

| Family representative | Median API-return RSS change (MiB) | Median post-GC heap change (KiB) | Median whole-worker peak RSS (MiB) |
|---|---:|---:|---:|
| flowchart | 4.125 | 3072.602 | 96.143 |
| sequence | 2.875 | 2261.617 | 94.527 |
| state | 17.865 | 13479.949 | 110.652 |
| class | 16.805 | 12979.375 | 110.357 |
| er | 20.852 | 12786.895 | 113.441 |
| timeline | 2.438 | 1999.906 | 93.938 |
| journey | 4.438 | 2440.680 | 96.555 |
| architecture | 25.459 | 13763.504 | 117.381 |
| xychart | 5.563 | 2465.270 | 96.859 |
| pie | 2.313 | 1847.941 | 94.396 |
| quadrant | 3.313 | 2151.172 | 95.057 |
| gantt | 2.938 | 2192.004 | 94.547 |
| mindmap | 3.125 | 2204.066 | 94.777 |
| gitgraph | 3.563 | 2314.965 | 95.613 |
| radar | 2.750 | 2146.953 | 94.941 |
| sankey | 2.875 | 2136.441 | 94.715 |
| c4 | 4.313 | 2680.504 | 96.650 |
| packet | 2.125 | 1802.750 | 93.795 |
| kanban | 2.000 | 1870.230 | 94.197 |
| requirement | 24.395 | 12709.457 | 116.490 |
| treemap | 2.188 | 1905.512 | 93.586 |
| ishikawa | 3.063 | 2131.188 | 94.787 |
| block | 2.125 | 2041.523 | 93.766 |
| eventmodeling | 4.875 | 2292.680 | 96.770 |
| zenuml | 3.250 | 2256.863 | 95.311 |

Live model cost: unavailable. No provider call is made by this runner. CPU cost needs an explicit rate; zero coarse CPU counters are censored, not free. Retention checkpoints at 0/10/100/1000 comment-varied calls of the same semantic graph are available for the declared small flowchart case, not all families or a leak proof.

## Uncalibrated or failed timing rows

- family:flowchart / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:state / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:state / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:class / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:class / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:class / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:er / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:er / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:architecture / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:xychart / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:xychart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:packet / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:treemap / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:treemap / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:block / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:zenuml / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-label-edit: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:wide-unicode / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / warm-label-edit: Observed A/A control spread exceeds the declared noise ceiling

## Reproduction and raw evidence

Evidence directory: /workspace/trident-ecosystem-b0-2026-10-30/campaign/portable/adewale%2Fagentic-mermaid/attempts/96f1b5c9-33b2-4c64-b23e-03cf594a7485

Sampling:
```json
{
  "rounds": 6,
  "samples": 31,
  "coldSamples": 5,
  "minSampleMs": 2,
  "workerTimeoutMs": 300000,
  "preparationConcurrency": 8,
  "maximumControlSpread": 0.25,
  "order": "rotate A0/A1/B by round and case; all warm jobs, then all cold jobs, then serial memory/baseline jobs",
  "controls": "A0/A1/B are the exact same admitted artifact, not three tool versions",
  "caseAdmission": "All selected cases remain in scope. A rejected family probe marks its cases unsupported. Invalid controls run once; cases failing or blocking admission retain their outcome but receive no further timing/resource jobs.",
  "warmScope": "Per-call means from batches bounded by minSampleMs or256calls; every distinct immutable SVG is checked outside clocks, byte-identical admitted returns reuse qualification; individual first-use samples are fresh processes",
  "commentVariantScope": "Trailing comment changes only source bytes, never semantic graph; this is a cache-key diagnostic",
  "coldScope": "Concurrent import preparation behind an idle barrier; one measured API call at a time and complete child exit before the next",
  "memoryScope": "Separate serial fresh processes; API snapshots precede qualification, GNU time describes the whole worker",
  "retentionCalls": [
    0,
    10,
    100,
    1000
  ]
}
```

Every individual first-use sample and every warm batch mean is retained. Representative SVG and full qualification payloads accompany raw results; repeated passing payloads are compacted. Dave, the historical fixed core and pinned-Mermaid scores are unchanged. Curves, clipping, full shape boundaries, computed fonts and perceptual quality need separate reviewed evidence.
