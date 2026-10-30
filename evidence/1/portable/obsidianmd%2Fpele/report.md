# obsidianmd/pele benchmark case study

Version: 1.12.0. Measured 2026-10-30T10:46:53.556Z through 2026-10-30T11:25:08.707Z. Fresh retained observations.

Cases: 54; families: 25; positive: 51; negative: 3. Failed workers: 0; blocked workers: 0.

Timing calibration: 12/152 rows calibrated. Format/text output admission: 50/51 positive cases; missing legacy evidence is not a failure. Declared native-plus-painted correspondence: 28/51 positive cases. Output admission, optional model APIs, painted correspondence and timing calibration are separate observations. No full-semantic performance claim is admitted without all its evidence.

A0, A1 and B use the same admitted artifact. Their differences diagnose measurement variation; they cannot establish a product speedup. Cold imports may prepare in batches, but first API calls execute one at a time after the complete idle barrier. Timings exclude import and qualification. Cases with a prelude report first-final-source timing after that prelude.

Calibration reports a descriptive A/A envelope separately from an exact median round-ratio uncertainty interval. Thousands of calls within five rounds are still only five independent rounds: a finite two-sided 95% sign interval needs at least six. Intervals require independent representative rounds and do not remove systematic host/workload differences. Repeated-source p95 values describe batch means, not individual tail latency.

Unsupported families: zenuml. The renderer rejected each family's canonical source, so their 1 cases were not run; they are coverage gaps, not failures.

## Family representatives

| Family | Warm repeated API median (ms) | Format/text-only calibrated | Full-check calibrated | Native + painted criteria |
|---|---:|---|---|---|
| flowchart | 0.4882 | false | false | declared criteria complete |
| sequence | 0.1131 | false | false | declared criteria complete |
| state | 0.4186 | false | false | declared criteria complete |
| class | 0.3104 | false | false | declared criteria complete |
| er | 0.2309 | false | false | declared criteria complete |
| timeline | 0.0386 | false | false | partial; see case scopes |
| journey | 0.0371 | false | false | partial; see case scopes |
| architecture | 0.1674 | false | false | partial; see case scopes |
| xychart | 0.1318 | false | false | partial; see case scopes |
| pie | 0.0526 | false | false | partial; see case scopes |
| quadrant | 0.0690 | false | false | partial; see case scopes |
| gantt | 0.2312 | false | false | partial; see case scopes |
| mindmap | 0.0578 | false | false | partial; see case scopes |
| gitgraph | 0.1332 | false | false | partial; see case scopes |
| radar | 0.0939 | false | false | partial; see case scopes |
| sankey | 0.0853 | false | false | partial; see case scopes |
| c4 | 0.0776 | false | false | partial; see case scopes |
| packet | 0.0272 | false | false | partial; see case scopes |
| kanban | 0.0293 | false | false | partial; see case scopes |
| requirement | 0.2799 | false | false | partial; see case scopes |
| treemap | 0.0898 | false | false | partial; see case scopes |
| ishikawa | 0.0417 | false | false | partial; see case scopes |
| block | 0.1063 | false | false | partial; see case scopes |
| eventmodeling | 0.1091 | false | false | partial; see case scopes |
| zenuml | unsupported | false | false | partial; see case scopes |

## Scaling

| Family | Size | Warm repeat median (ms) | Warm calibrated | First-use p95 (ms) | First-use calibrated |
|---|---:|---:|---|---:|---|
| flowchart | 8 | 0.7351 | false | 41.6940 | false |
| flowchart | 32 | 1.7522 | false | 174.8133 | true |
| flowchart | 128 | 4.4216 | false | 60.7392 | false |
| sequence | 8 | 0.2046 | false | 28.6205 | false |
| sequence | 32 | 0.3466 | false | 45.4531 | false |
| sequence | 128 | 1.1026 | false | 29.2529 | false |
| class | 8 | 0.7469 | false | 30.1680 | false |
| class | 32 | 1.3565 | false | 57.3095 | false |
| class | 128 | 3.9026 | false | 44.8500 | false |
| state | 8 | 0.6491 | false | 32.9260 | false |
| state | 32 | 2.4186 | false | 31.6815 | false |
| state | 128 | 3.3761 | false | 139.8993 | false |
| er | 8 | 0.5825 | false | 52.4503 | false |
| er | 32 | 1.8271 | false | 64.6260 | false |
| er | 128 | 3.9690 | false | 67.3107 | false |
| architecture | 8 | 0.4592 | false | 16.0189 | false |
| architecture | 32 | 1.1906 | false | 28.0646 | true |
| architecture | 128 | 2.9393 | false | 34.6960 | false |

## Individual cases and fidelity

| Case | Acceptance matches | Format/text admission | Failed / blocked workers | Semantic scope |
|---|---|---|---:|---|
| family:flowchart | true | passed | 0 / 0 | Declared native + painted checks complete |
| family:sequence | true | passed | 0 / 0 | Declared native + painted checks complete |
| family:state | true | passed | 0 / 0 | Declared native + painted checks complete |
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
| family:zenuml | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:flowchart:8 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:flowchart:32 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:flowchart:128 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:sequence:8 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:sequence:32 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:sequence:128 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:class:8 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:class:32 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:class:128 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:state:8 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:state:32 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:state:128 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:er:8 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:er:32 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:er:128 | true | passed | 0 / 0 | Declared native + painted checks complete |
| scaling:architecture:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:label-edit | true | passed | 0 / 0 | Declared native + painted checks complete |
| adversarial:parallel-reciprocal | true | passed | 0 / 0 | Declared native + painted checks complete |
| adversarial:nested-groups | true | passed | 0 / 0 | Declared native + painted checks complete |
| adversarial:wide-unicode | true | passed | 0 / 0 | Declared native + painted checks complete |
| adversarial:generated-looking-ids | true | passed | 0 / 0 | Declared native + painted checks complete |
| adversarial:quoted-labels | true | passed | 0 / 0 | Declared native + painted checks complete |
| adversarial:invalid-recovery | true | passed | 0 / 0 | Declared native + painted checks complete |
| adversarial:configuration-reset | true | passed | 0 / 0 | Declared native + painted checks complete |
| invalid:unknown-header | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:missing-endpoints | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:unfinished-sequence | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |

## Memory and cost

API RSS/heap snapshots are read before output qualification, at return and after dropping the output and requesting GC. Signed deltas remain signed. Independent import/prelude-only baseline processes are retained. These snapshots do not measure peak native/WASM/GPU allocation. GNU time peaks and CPU, when available, describe the whole worker, including import, driver, GC and later qualification; they are not API-only peaks or provider invoices.

| Family representative | Median API-return RSS change (MiB) | Median post-GC heap change (KiB) | Median whole-worker peak RSS (MiB) |
|---|---:|---:|---:|
| flowchart | 0.313 | 372.281 | 67.973 |
| sequence | 0.000 | 175.469 | 68.582 |
| state | 0.375 | 362.086 | 68.414 |
| class | 0.250 | 269.211 | 67.912 |
| er | 0.250 | 262.523 | 67.555 |
| timeline | 0.000 | 100.945 | 68.047 |
| journey | 0.000 | 92.984 | 67.801 |
| architecture | 0.125 | 182.969 | 68.465 |
| xychart | 0.063 | 148.250 | 67.664 |
| pie | 0.063 | 113.367 | 68.100 |
| quadrant | 0.125 | 122.539 | 68.531 |
| gantt | 0.438 | 194.391 | 68.094 |
| mindmap | 0.063 | 92.867 | 68.471 |
| gitgraph | 0.000 | 167.078 | 67.980 |
| radar | 0.063 | 158.398 | 68.049 |
| sankey | 0.063 | 137.148 | 68.252 |
| c4 | 0.188 | 141.234 | 68.113 |
| packet | 0.000 | 133.086 | 67.555 |
| kanban | 0.063 | 97.984 | 68.174 |
| requirement | 0.250 | 266.336 | 68.652 |
| treemap | 0.125 | 161.039 | 68.109 |
| ishikawa | 0.000 | 86.438 | 67.994 |
| block | 0.188 | 143.078 | 68.604 |
| eventmodeling | 0.188 | 176.250 | 67.775 |
| zenuml | unavailable | unavailable | unavailable |

Live model cost: unavailable. No provider call is made by this runner. CPU cost needs an explicit rate; zero coarse CPU counters are censored, not free. Retention checkpoints at 0/10/100/1000 comment-varied calls of the same semantic graph are available for the declared small flowchart case, not all families or a leak proof.

## Uncalibrated or failed timing rows

- family:flowchart / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:state / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:state / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:state / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:class / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:class / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:class / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:er / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:er / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:er / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:architecture / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:architecture / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:xychart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:xychart / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:packet / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:packet / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:treemap / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:treemap / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:treemap / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:block / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-label-edit: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:wide-unicode / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:wide-unicode / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:wide-unicode / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / warm-label-edit: Observed A/A control spread exceeds the declared noise ceiling

## Reproduction and raw evidence

Evidence directory: /workspace/trident-ecosystem-b0-2026-10-30/campaign/portable/obsidianmd%2Fpele/attempts/d6a91ab5-6513-4db1-8e18-a0d2ec42bd1d

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
