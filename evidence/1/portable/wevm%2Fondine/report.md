# wevm/ondine benchmark case study

Version: 0.0.3. Measured 2026-10-30T05:25:42.364Z through 2026-10-30T05:55:32.434Z. Fresh retained observations.

Cases: 54; families: 25; positive: 51; negative: 3. Failed workers: 0; blocked workers: 1.

Timing calibration: 39/152 rows calibrated. Format/text output admission: 49/51 positive cases; missing legacy evidence is not a failure. Declared native-plus-painted correspondence: 0/51 positive cases. Output admission, optional model APIs, painted correspondence and timing calibration are separate observations. No full-semantic performance claim is admitted without all its evidence.

A0, A1 and B use the same admitted artifact. Their differences diagnose measurement variation; they cannot establish a product speedup. Cold imports may prepare in batches, but first API calls execute one at a time after the complete idle barrier. Timings exclude import and qualification. Cases with a prelude report first-final-source timing after that prelude.

Calibration reports a descriptive A/A envelope separately from an exact median round-ratio uncertainty interval. Thousands of calls within five rounds are still only five independent rounds: a finite two-sided 95% sign interval needs at least six. Intervals require independent representative rounds and do not remove systematic host/workload differences. Repeated-source p95 values describe batch means, not individual tail latency.

Unsupported families: zenuml. The renderer rejected each family's canonical source, so their 1 cases were not run; they are coverage gaps, not failures.

## Family representatives

| Family | Warm repeated API median (ms) | Format/text-only calibrated | Full-check calibrated | Native + painted criteria |
|---|---:|---|---|---|
| flowchart | 0.0954 | false | false | partial; see case scopes |
| sequence | 0.0728 | false | false | partial; see case scopes |
| state | 0.0753 | false | false | partial; see case scopes |
| class | 0.0796 | false | false | partial; see case scopes |
| er | 0.0632 | false | false | partial; see case scopes |
| timeline | 0.0391 | false | false | partial; see case scopes |
| journey | 0.0558 | false | false | partial; see case scopes |
| architecture | 0.0799 | false | false | partial; see case scopes |
| xychart | 0.0636 | false | false | partial; see case scopes |
| pie | 0.0377 | false | false | partial; see case scopes |
| quadrant | 0.0514 | false | false | partial; see case scopes |
| gantt | 0.1141 | true | true | partial; see case scopes |
| mindmap | 0.0361 | false | false | partial; see case scopes |
| gitgraph | 0.0927 | false | false | partial; see case scopes |
| radar | 0.0592 | false | false | partial; see case scopes |
| sankey | 0.0516 | false | false | partial; see case scopes |
| c4 | 0.0623 | false | false | partial; see case scopes |
| packet | 0.0271 | false | false | partial; see case scopes |
| kanban | 0.0415 | false | false | partial; see case scopes |
| requirement | 0.1193 | false | false | partial; see case scopes |
| treemap | 0.0466 | true | true | partial; see case scopes |
| ishikawa | 0.0434 | false | false | partial; see case scopes |
| block | 0.0403 | false | false | partial; see case scopes |
| eventmodeling | 0.0979 | false | false | partial; see case scopes |
| zenuml | unsupported | false | false | partial; see case scopes |

## Scaling

| Family | Size | Warm repeat median (ms) | Warm calibrated | First-use p95 (ms) | First-use calibrated |
|---|---:|---:|---|---:|---|
| flowchart | 8 | 0.2902 | false | 85.3938 | true |
| flowchart | 32 | 1.0578 | false | 109.4391 | true |
| flowchart | 128 | 3.2846 | false | 85.0466 | true |
| sequence | 8 | 0.1149 | false | 38.5607 | true |
| sequence | 32 | 0.3511 | false | 48.8886 | true |
| sequence | 128 | 0.7479 | false | 45.6875 | false |
| class | 8 | 0.1657 | false | 55.9915 | true |
| class | 32 | 0.9043 | false | 57.0581 | true |
| class | 128 | 2.7865 | false | 96.7695 | false |
| state | 8 | 0.2193 | false | 61.6042 | false |
| state | 32 | 0.8363 | false | 101.6340 | true |
| state | 128 | 2.8146 | true | 139.6269 | false |
| er | 8 | 0.2546 | false | 63.0007 | false |
| er | 32 | 0.8799 | false | 67.8516 | false |
| er | 128 | 2.9742 | false | 105.1929 | true |
| architecture | 8 | 0.2602 | false | 69.4579 | true |
| architecture | 32 | 0.8611 | true | 50.3046 | true |
| architecture | 128 | 2.6923 | false | 65.7593 | false |

## Individual cases and fidelity

| Case | Acceptance matches | Format/text admission | Failed / blocked workers | Semantic scope |
|---|---|---|---:|---|
| family:flowchart | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sequence | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:state | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:class | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:er | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
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
| scaling:flowchart:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
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
| adversarial:configuration-reset | false | unavailable in retained protocol | 0 / 1 | Paint/native projection incomplete; never a full fidelity pass |
| invalid:unknown-header | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:missing-endpoints | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:unfinished-sequence | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |

## Memory and cost

API RSS/heap snapshots are read before output qualification, at return and after dropping the output and requesting GC. Signed deltas remain signed. Independent import/prelude-only baseline processes are retained. These snapshots do not measure peak native/WASM/GPU allocation. GNU time peaks and CPU, when available, describe the whole worker, including import, driver, GC and later qualification; they are not API-only peaks or provider invoices.

| Family representative | Median API-return RSS change (MiB) | Median post-GC heap change (KiB) | Median whole-worker peak RSS (MiB) |
|---|---:|---:|---:|
| flowchart | 15.125 | 109.516 | 79.068 |
| sequence | 7.625 | 84.813 | 71.592 |
| state | 14.875 | 102.813 | 79.459 |
| class | 14.813 | 99.859 | 78.586 |
| er | 14.750 | 98.047 | 79.176 |
| timeline | 7.375 | 74.500 | 72.088 |
| journey | 7.500 | 75.406 | 71.648 |
| architecture | 7.625 | 78.734 | 71.787 |
| xychart | 7.438 | 74.578 | 71.729 |
| pie | 7.375 | 73.547 | 71.639 |
| quadrant | 7.375 | 74.047 | 71.955 |
| gantt | 8.750 | 82.031 | 73.158 |
| mindmap | 7.438 | 78.875 | 72.039 |
| gitgraph | 7.500 | 78.234 | 71.656 |
| radar | 7.500 | 73.828 | 71.932 |
| sankey | 7.375 | 73.789 | 71.930 |
| c4 | 7.625 | 83.641 | 72.031 |
| packet | 7.375 | 72.391 | 71.775 |
| kanban | 7.375 | 74.516 | 71.648 |
| requirement | 14.563 | 94.203 | 78.771 |
| treemap | 7.438 | 74.547 | 71.850 |
| ishikawa | 7.313 | 73.047 | 71.566 |
| block | 7.625 | 85.391 | 72.072 |
| eventmodeling | 7.500 | 76.516 | 71.604 |
| zenuml | unavailable | unavailable | unavailable |

Live model cost: unavailable. No provider call is made by this runner. CPU cost needs an explicit rate; zero coarse CPU counters are censored, not free. Retention checkpoints at 0/10/100/1000 comment-varied calls of the same semantic graph are available for the declared small flowchart case, not all families or a leak proof.

## Uncalibrated or failed timing rows

- family:flowchart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
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
- family:architecture / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:architecture / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:xychart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:xychart / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:packet / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:block / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-label-edit: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:wide-unicode / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:wide-unicode / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-label-edit: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated

## Reproduction and raw evidence

Evidence directory: /workspace/trident-ecosystem-b0-2026-10-30/campaign/portable/wevm%2Fondine/attempts/08b1887e-a768-4e3d-9c31-7276b7e608c9

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
